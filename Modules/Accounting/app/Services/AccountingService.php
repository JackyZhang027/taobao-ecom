<?php

namespace Modules\Accounting\Services;

use Illuminate\Support\Facades\DB;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

class AccountingService
{
    /**
     * Post a draft journal entry.
     *
     * @throws \RuntimeException
     */
    public function postEntry(JournalEntry $entry): void
    {
        DB::transaction(function () use ($entry) {
            // Re-fetch with an exclusive lock so a concurrent post/void can't
            // pass the status check simultaneously.
            $entry = JournalEntry::lockForUpdate()->findOrFail($entry->id);
            $entry->load('lines');

            if (! $entry->isDraft()) {
                throw new \RuntimeException('Only draft entries can be posted.');
            }

            if ($entry->lines->count() < 2) {
                throw new \RuntimeException('A journal entry must have at least two lines.');
            }

            if (! $entry->isBalanced()) {
                throw new \RuntimeException(
                    sprintf(
                        'Journal entry is not balanced. Debits: %.2f, Credits: %.2f',
                        $entry->totalDebits(),
                        $entry->totalCredits()
                    )
                );
            }

            $entry->update(['status' => 'posted']);
        });
    }

    /**
     * Void a posted entry by creating a reversing entry.
     *
     * @throws \RuntimeException
     */
    public function voidEntry(JournalEntry $entry, int $userId): void
    {
        DB::transaction(function () use ($entry, $userId) {
            // Re-fetch with an exclusive lock — a double-submitted void must not
            // create two reversing entries.
            $entry = JournalEntry::lockForUpdate()->findOrFail($entry->id);

            if (! $entry->isPosted()) {
                throw new \RuntimeException('Only posted entries can be voided.');
            }

            $entry->update(['status' => 'voided']);

            $reversing = JournalEntry::create([
                'date' => now()->toDateString(),
                'reference_number' => 'VOID-'.$entry->reference_number,
                'description' => 'Reversal of: '.$entry->description,
                'status' => 'posted',
                'created_by' => $userId,
            ]);

            foreach ($entry->lines as $line) {
                JournalLine::create([
                    'journal_entry_id' => $reversing->id,
                    'account_id' => $line->account_id,
                    'description' => $line->description,
                    'debit' => $line->credit,
                    'credit' => $line->debit,
                ]);
            }
        });
    }

    /**
     * Generate a unique reference number in format JNL-YYYYMM-NNNN.
     */
    public function generateReferenceNumber(): string
    {
        $prefix = 'JNL-'.now()->format('Ym').'-';

        $last = JournalEntry::where('reference_number', 'like', $prefix.'%')
            ->orderByDesc('reference_number')
            ->value('reference_number');

        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Trial Balance — all active accounts with debit/credit totals and net balance.
     * Only includes posted journal entries.
     *
     * @return array<int, array<string, mixed>>
     */
    public function trialBalance(?string $startDate = null, ?string $endDate = null): array
    {
        $accounts = Account::where('is_active', true)->orderBy('code')->get();

        // One grouped aggregate instead of two queries per account.
        $totals = JournalLine::selectRaw('account_id, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'posted');
                // whereDate: comparisons must be date-level on every driver —
                // SQLite stores casted dates with a time component.
                if ($startDate) {
                    $q->whereDate('date', '>=', $startDate);
                }
                if ($endDate) {
                    $q->whereDate('date', '<=', $endDate);
                }
            })
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        return $accounts->map(function (Account $account) use ($totals) {
            $row = $totals->get($account->id);
            $totalDebit = (float) ($row->total_debit ?? 0);
            $totalCredit = (float) ($row->total_credit ?? 0);

            $balance = $account->normal_balance === 'debit'
                ? $totalDebit - $totalCredit
                : $totalCredit - $totalDebit;

            return [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'normal_balance' => $account->normal_balance,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'balance' => $balance,
            ];
        })->all();
    }

    /**
     * Balance Sheet as of a given date.
     */
    public function balanceSheet(?string $asOfDate = null): array
    {
        $date = $asOfDate ?? now()->toDateString();
        $rows = $this->trialBalance(null, $date);

        $assets = array_values(array_filter($rows, fn ($r) => $r['type'] === 'asset'));
        $liabilities = array_values(array_filter($rows, fn ($r) => $r['type'] === 'liability'));
        $equity = array_values(array_filter($rows, fn ($r) => $r['type'] === 'equity'));
        $revenues = array_values(array_filter($rows, fn ($r) => $r['type'] === 'revenue'));
        $expenses = array_values(array_filter($rows, fn ($r) => $r['type'] === 'expense'));

        $totalAssets = array_sum(array_column($assets, 'balance'));
        $totalLiabilities = array_sum(array_column($liabilities, 'balance'));
        $totalEquity = array_sum(array_column($equity, 'balance'));
        $totalRevenue = array_sum(array_column($revenues, 'balance'));
        $totalExpenses = array_sum(array_column($expenses, 'balance'));
        $netIncome = $totalRevenue - $totalExpenses;

        return [
            'as_of_date' => $date,
            'assets' => $assets,
            'total_assets' => $totalAssets,
            'liabilities' => $liabilities,
            'total_liabilities' => $totalLiabilities,
            'equity' => $equity,
            'total_equity' => $totalEquity,
            'net_income' => $netIncome,
            'total_liab_equity' => $totalLiabilities + $totalEquity + $netIncome,
        ];
    }

    /**
     * Income Statement for a date range.
     */
    public function incomeStatement(?string $startDate = null, ?string $endDate = null): array
    {
        $rows = $this->trialBalance($startDate, $endDate);

        $revenues = array_values(array_filter($rows, fn ($r) => $r['type'] === 'revenue'));
        $expenses = array_values(array_filter($rows, fn ($r) => $r['type'] === 'expense'));

        $totalRevenue = array_sum(array_column($revenues, 'balance'));
        $totalExpenses = array_sum(array_column($expenses, 'balance'));

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'revenues' => $revenues,
            'total_revenue' => $totalRevenue,
            'expenses' => $expenses,
            'total_expenses' => $totalExpenses,
            'net_income' => $totalRevenue - $totalExpenses,
        ];
    }

    /**
     * General Ledger for a single account with running balance.
     *
     * @return array<string, mixed>
     */
    public function ledger(Account $account, ?string $startDate, ?string $endDate): array
    {
        $lines = JournalLine::with('journalEntry')
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'posted');
                // whereDate: comparisons must be date-level on every driver —
                // SQLite stores casted dates with a time component.
                if ($startDate) {
                    $q->whereDate('date', '>=', $startDate);
                }
                if ($endDate) {
                    $q->whereDate('date', '<=', $endDate);
                }
            })
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->orderBy('journal_entries.date')
            ->orderBy('journal_lines.id')
            ->select('journal_lines.*')
            ->get();

        $runningBalance = 0.0;
        $rows = [];

        foreach ($lines as $line) {
            if ($account->normal_balance === 'debit') {
                $runningBalance += $line->debit - $line->credit;
            } else {
                $runningBalance += $line->credit - $line->debit;
            }

            $rows[] = [
                'date' => $line->journalEntry->date->toDateString(),
                'reference' => $line->journalEntry->reference_number,
                'description' => $line->description ?? $line->journalEntry->description,
                'debit' => $line->debit,
                'credit' => $line->credit,
                'running_balance' => $runningBalance,
            ];
        }

        return [
            'account' => $account,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'lines' => $rows,
            'final_balance' => $runningBalance,
        ];
    }
}
