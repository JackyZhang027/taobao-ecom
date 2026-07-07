<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Modules\Accounting\Services\AccountingService;

uses(RefreshDatabase::class);

function ledgerEntry(string $status, string $date, Account $debitAccount, Account $creditAccount, float $amount): JournalEntry
{
    $entry = JournalEntry::create([
        'date' => $date,
        'reference_number' => 'JNL-GL-'.uniqid(),
        'description' => 'Ledger seed',
        'status' => $status,
        'created_by' => User::factory()->create()->id,
    ]);
    JournalLine::create(['journal_entry_id' => $entry->id, 'account_id' => $debitAccount->id, 'debit' => $amount, 'credit' => 0]);
    JournalLine::create(['journal_entry_id' => $entry->id, 'account_id' => $creditAccount->id, 'debit' => 0, 'credit' => $amount]);

    return $entry;
}

test('ledger seeds the running balance with posted activity before the start date', function () {
    $cash = Account::create(['code' => '1000', 'name' => 'Cash', 'type' => 'asset', 'normal_balance' => 'debit', 'is_active' => true]);
    $sales = Account::create(['code' => '4000', 'name' => 'Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_active' => true]);

    ledgerEntry('posted', '2026-06-10', $cash, $sales, 100); // before range
    ledgerEntry('posted', '2026-06-20', $cash, $sales, 50);  // before range
    ledgerEntry('posted', '2026-07-05', $cash, $sales, 40);  // in range

    $ledger = app(AccountingService::class)->ledger($cash, '2026-07-01', '2026-07-31');

    expect($ledger['opening_balance'])->toBe(150.0);
    expect($ledger['lines'])->toHaveCount(1);
    expect($ledger['lines'][0]['running_balance'])->toBe(190.0);
    expect($ledger['final_balance'])->toBe(190.0);
});

test('ledger opening balance respects credit-normal accounts and excludes drafts and voided entries', function () {
    $cash = Account::create(['code' => '1000', 'name' => 'Cash', 'type' => 'asset', 'normal_balance' => 'debit', 'is_active' => true]);
    $sales = Account::create(['code' => '4000', 'name' => 'Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_active' => true]);

    ledgerEntry('posted', '2026-06-10', $cash, $sales, 100); // counts
    ledgerEntry('draft', '2026-06-11', $cash, $sales, 999);  // draft — excluded
    ledgerEntry('voided', '2026-06-12', $cash, $sales, 999); // voided — excluded

    $ledger = app(AccountingService::class)->ledger($sales, '2026-07-01', null);

    expect($ledger['opening_balance'])->toBe(100.0); // credit-normal: credits minus debits
    expect($ledger['final_balance'])->toBe(100.0);
});

test('ledger without a start date has a zero opening balance and includes all posted lines', function () {
    $cash = Account::create(['code' => '1000', 'name' => 'Cash', 'type' => 'asset', 'normal_balance' => 'debit', 'is_active' => true]);
    $sales = Account::create(['code' => '4000', 'name' => 'Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_active' => true]);

    ledgerEntry('posted', '2026-06-10', $cash, $sales, 100);
    ledgerEntry('posted', '2026-07-05', $cash, $sales, 40);

    $ledger = app(AccountingService::class)->ledger($cash, null, null);

    expect($ledger['opening_balance'])->toBe(0.0);
    expect($ledger['lines'])->toHaveCount(2);
    expect($ledger['final_balance'])->toBe(140.0);
});
