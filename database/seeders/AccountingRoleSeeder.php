<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class AccountingRoleSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::firstOrCreate(['name' => 'accounting', 'guard_name' => 'web']);

        $role->syncPermissions([
            'admin.access',
            'accounting_accounts.view', 'accounting_accounts.create', 'accounting_accounts.edit', 'accounting_accounts.delete',
            'accounting_journals.view', 'accounting_journals.create', 'accounting_journals.edit', 'accounting_journals.delete',
            'accounting_ledger.view',
            'accounting_trial_balance.view',
            'accounting_balance_sheet.view',
            'accounting_income_statement.view',
        ]);
    }
}
