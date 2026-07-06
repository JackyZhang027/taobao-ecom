<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function createAccountingAdmin(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    foreach (['admin.access', 'accounting_journals.view', 'accounting_journals.create', 'accounting_journals.edit'] as $name) {
        $adminRole->givePermissionTo(Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']));
    }

    $user = User::factory()->create();
    $user->assignRole($adminRole);

    return $user;
}

function journalAccounts(): array
{
    return [
        Account::create(['code' => '1000', 'name' => 'Cash', 'type' => 'asset', 'normal_balance' => 'debit', 'is_active' => true]),
        Account::create(['code' => '4000', 'name' => 'Sales', 'type' => 'revenue', 'normal_balance' => 'credit', 'is_active' => true]),
    ];
}

function journalPayload(array $lines, array $overrides = []): array
{
    return array_merge([
        'date' => '2026-07-01',
        'reference_number' => 'JNL-TEST-'.uniqid(),
        'description' => 'Test entry',
        'lines' => $lines,
    ], $overrides);
}

test('a line with neither debit nor credit is rejected', function () {
    $admin = createAccountingAdmin();
    [$cash, $sales] = journalAccounts();

    $this->actingAs($admin)->post('/admin/accounting/journals', journalPayload([
        ['account_id' => $cash->id, 'debit' => 0, 'credit' => 0],
        ['account_id' => $sales->id, 'debit' => 0, 'credit' => 0],
    ]))->assertSessionHasErrors('lines.0');

    expect(JournalEntry::count())->toBe(0);
});

test('a line with both debit and credit is rejected', function () {
    $admin = createAccountingAdmin();
    [$cash, $sales] = journalAccounts();

    $this->actingAs($admin)->post('/admin/accounting/journals', journalPayload([
        ['account_id' => $cash->id, 'debit' => 100, 'credit' => 100],
        ['account_id' => $sales->id, 'debit' => 100, 'credit' => 100],
    ]))->assertSessionHasErrors('lines.0');

    expect(JournalEntry::count())->toBe(0);
});

test('a valid balanced entry is stored as draft', function () {
    $admin = createAccountingAdmin();
    [$cash, $sales] = journalAccounts();

    $this->actingAs($admin)->post('/admin/accounting/journals', journalPayload([
        ['account_id' => $cash->id, 'debit' => 100, 'credit' => 0],
        ['account_id' => $sales->id, 'debit' => 0, 'credit' => 100],
    ]))->assertRedirect('/admin/accounting/journals');

    $entry = JournalEntry::firstOrFail();
    expect($entry->status)->toBe('draft');
    expect($entry->lines()->count())->toBe(2);
});

test('voiding fails gracefully when the reversing reference already exists', function () {
    $admin = createAccountingAdmin();
    [$cash, $sales] = journalAccounts();

    $entry = JournalEntry::create([
        'date' => '2026-07-01',
        'reference_number' => 'JNL-COLLIDE',
        'description' => 'Original entry',
        'status' => 'posted',
        'created_by' => $admin->id,
    ]);
    JournalLine::create(['journal_entry_id' => $entry->id, 'account_id' => $cash->id, 'debit' => 100, 'credit' => 0]);
    JournalLine::create(['journal_entry_id' => $entry->id, 'account_id' => $sales->id, 'debit' => 0, 'credit' => 100]);

    // Occupy the reference the reversal would use.
    JournalEntry::create([
        'date' => '2026-07-01',
        'reference_number' => 'VOID-JNL-COLLIDE',
        'description' => 'Squatter',
        'status' => 'draft',
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->post("/admin/accounting/journals/{$entry->id}/void")
        ->assertRedirect()
        ->assertSessionHasErrors('entry');

    // The transaction rolled back: the original entry is still posted.
    expect($entry->fresh()->status)->toBe('posted');
    expect(JournalEntry::count())->toBe(2);
});
