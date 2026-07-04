<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Admin\Models\ShopSetting;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function createWhatsappAdminUser(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    foreach (['admin.access', 'settings.view', 'settings.edit'] as $name) {
        $permission = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

    $user = User::factory()->create();
    $user->assignRole($adminRole);

    return $user;
}

test('admin can view the whatsapp settings page', function () {
    $admin = createWhatsappAdminUser();

    $this->actingAs($admin)->get('/admin/settings/whatsapp')->assertOk();
});

test('admin can save the sender number and admin recipient numbers', function () {
    $admin = createWhatsappAdminUser();

    $this->actingAs($admin)->post('/admin/settings/whatsapp', [
        'settings' => [
            'whatsapp_sender' => '62800000000',
            'whatsapp_admin_numbers' => '628111111111,628222222222',
        ],
    ])->assertRedirect();

    expect(ShopSetting::get('whatsapp_sender'))->toBe('62800000000');
    expect(ShopSetting::get('whatsapp_admin_numbers'))->toBe('628111111111,628222222222');
});

test('admin can save the customer reminder settings', function () {
    $admin = createWhatsappAdminUser();

    $this->actingAs($admin)->post('/admin/settings/whatsapp', [
        'settings' => [
            'whatsapp_customer_reminder_enabled' => '1',
            'whatsapp_customer_reminder_schedule' => '10m,6h,1d',
        ],
    ])->assertRedirect();

    expect(ShopSetting::get('whatsapp_customer_reminder_enabled'))->toBe('1');
    expect(ShopSetting::get('whatsapp_customer_reminder_schedule'))->toBe('10m,6h,1d');
});

test('saving a malformed reminder schedule is rejected', function () {
    $admin = createWhatsappAdminUser();

    $this->actingAs($admin)->post('/admin/settings/whatsapp', [
        'settings' => [
            'whatsapp_customer_reminder_schedule' => '10x,6h',
        ],
    ])->assertSessionHasErrors('settings.whatsapp_customer_reminder_schedule');
});

test('saving a reminder schedule below the 10 minute minimum is rejected', function () {
    $admin = createWhatsappAdminUser();

    $this->actingAs($admin)->post('/admin/settings/whatsapp', [
        'settings' => [
            'whatsapp_customer_reminder_schedule' => '5m,6h',
        ],
    ])->assertSessionHasErrors('settings.whatsapp_customer_reminder_schedule');
});

test('saving an unknown setting key is rejected', function () {
    $admin = createWhatsappAdminUser();

    $this->actingAs($admin)->post('/admin/settings/whatsapp', [
        'settings' => ['not_a_real_key' => 'value'],
    ])->assertStatus(422);
});

test('a user without settings.edit cannot save whatsapp settings', function () {
    $role = Role::firstOrCreate(['name' => 'limited-admin', 'guard_name' => 'web']);
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'admin.access', 'guard_name' => 'web']));
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'settings.view', 'guard_name' => 'web']));
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)->post('/admin/settings/whatsapp', [
        'settings' => ['whatsapp_sender' => '62800000000'],
    ])->assertForbidden();
});

test('generateQr proxies the gateway response', function () {
    $admin = createWhatsappAdminUser();
    ShopSetting::set('whatsapp_sender', '62800000000');
    Http::fake(['*/generate-qr' => Http::response(['status' => 'processing', 'message' => 'Processing'])]);

    $this->actingAs($admin)->post('/admin/settings/whatsapp/qr')
        ->assertOk()
        ->assertJson(['status' => 'processing', 'message' => 'Processing']);
});

test('logoutDevice proxies the gateway response', function () {
    $admin = createWhatsappAdminUser();
    ShopSetting::set('whatsapp_sender', '62800000000');
    Http::fake(['*/logout-device' => Http::response(['status' => true, 'message' => 'device disconnected'])]);

    $this->actingAs($admin)->post('/admin/settings/whatsapp/logout-device')
        ->assertOk()
        ->assertJson(['status' => true, 'message' => 'device disconnected']);
});
