<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Modules\Accounting\Services\AccountingService;

uses(RefreshDatabase::class);

function trialBalanceEntry(string $status, string $date, Account $debitAccount, Account $creditAccount, float $amount): JournalEntry
{
    $entry = JournalEntry::create([
        'date' => $date,
        'reference_number' => 'JNL-TB-'.uniqid(),
        'description' => 'Trial balance seed',
        'status' => $status,
        'created_by' => User::factory()->create()->id,
    ]);
    JournalLine::create(['journal_entry_id' => $entry->id, 'account_id' => $debitAccount->id, 'debit' => $amount, 'credit' => 0]);
    JournalLine::create(['journal_entry_id' => $entry->id, 'account_id' => $creditAccount->id, 'debit' => 0, 'credit' => $amount]);

    return $entry;
}

test('trial balance aggregates posted entries per account and excludes drafts', function () {
    $cash = Account::create(['code' => '1000', 'name' => 'Cash', 'type' => 'asset', 'normal_balance' => 'debit', 'is_active' => true]);
    $sales = Account::create(['code' => '4000', 'name' => 'Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_active' => true]);
    $idle = Account::create(['code' => '5000', 'name' => 'Unused Expense', 'type' => 'expense', 'normal_balance' => 'debit', 'is_active' => true]);
    $inactive = Account::create(['code' => '9999', 'name' => 'Inactive', 'type' => 'asset', 'normal_balance' => 'debit', 'is_active' => false]);

    trialBalanceEntry('posted', '2026-07-01', $cash, $sales, 100);
    trialBalanceEntry('posted', '2026-07-02', $cash, $sales, 50);
    trialBalanceEntry('draft', '2026-07-03', $cash, $sales, 999);

    $rows = collect(app(AccountingService::class)->trialBalance());

    // Inactive accounts are excluded; accounts with no lines still appear at 0.
    expect($rows->pluck('code')->all())->toBe(['1000', '4000', '5000']);

    $cashRow = $rows->firstWhere('code', '1000');
    expect($cashRow['total_debit'])->toBe(150.0);
    expect($cashRow['total_credit'])->toBe(0.0);
    expect($cashRow['balance'])->toBe(150.0);

    $salesRow = $rows->firstWhere('code', '4000');
    expect($salesRow['total_debit'])->toBe(0.0);
    expect($salesRow['total_credit'])->toBe(150.0);
    expect($salesRow['balance'])->toBe(150.0); // credit-normal account

    $idleRow = $rows->firstWhere('code', '5000');
    expect($idleRow['total_debit'])->toBe(0.0);
    expect($idleRow['total_credit'])->toBe(0.0);
    expect($idleRow['balance'])->toBe(0.0);
});

test('trial balance respects the date range filters', function () {
    $cash = Account::create(['code' => '1000', 'name' => 'Cash', 'type' => 'asset', 'normal_balance' => 'debit', 'is_active' => true]);
    $sales = Account::create(['code' => '4000', 'name' => 'Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_active' => true]);

    trialBalanceEntry('posted', '2026-06-15', $cash, $sales, 100); // before range
    trialBalanceEntry('posted', '2026-07-01', $cash, $sales, 40);  // in range
    trialBalanceEntry('posted', '2026-07-31', $cash, $sales, 60);  // in range
    trialBalanceEntry('posted', '2026-08-01', $cash, $sales, 100); // after range

    $rows = collect(app(AccountingService::class)->trialBalance('2026-07-01', '2026-07-31'));

    expect($rows->firstWhere('code', '1000')['total_debit'])->toBe(100.0);
    expect($rows->firstWhere('code', '4000')['total_credit'])->toBe(100.0);
});
