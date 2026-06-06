<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public const PERMISSIONS = [
        'admin.access',
        'dashboard.view',
        'products.view', 'products.create', 'products.edit', 'products.delete',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'orders.view', 'orders.create', 'orders.edit',
        'customers.view', 'customers.edit',
        'wishlists.view', 'wishlists.delete',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'settings.view', 'settings.edit',
        'hero_slides.view', 'hero_slides.create', 'hero_slides.edit', 'hero_slides.delete',
        'exchange_rates.view', 'exchange_rates.create',
        'social_links.view', 'social_links.create', 'social_links.edit', 'social_links.delete',
        'store_features.view', 'store_features.edit',
        'accounting_accounts.view', 'accounting_accounts.create', 'accounting_accounts.edit', 'accounting_accounts.delete',
        'accounting_journals.view', 'accounting_journals.create', 'accounting_journals.edit', 'accounting_journals.delete',
        'accounting_ledger.view',
        'accounting_trial_balance.view',
        'accounting_balance_sheet.view',
        'accounting_income_statement.view',
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Remove any permissions no longer in the canonical list (e.g. old accounting.* entries).
        Permission::whereNotIn('name', self::PERMISSIONS)->delete();

        // Give the admin role all permissions so getAllPermissions() returns the
        // full list for the frontend sidebar. Gate::before handles actual authorization.
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(self::PERMISSIONS);
    }
}
