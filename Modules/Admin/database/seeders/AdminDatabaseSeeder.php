<?php

namespace Modules\Admin\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Admin\Models\ShopSetting;

class AdminDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $admin->assignRole('admin');

        $this->command->info('Admin user ready: admin@example.com / password');

        if (! ShopSetting::get('description')) {
            ShopSetting::set('description', 'Quality products, thoughtfully curated. Fast shipping and easy returns.');
        }
    }
}
