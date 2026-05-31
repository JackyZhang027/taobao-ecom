<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function makeAdmin(array $permissions = []): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $required = array_merge(['admin.access', 'customers.view'], $permissions);
    foreach ($required as $name) {
        $permission = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

    $user = User::factory()->create();
    $user->assignRole($adminRole);

    return $user;
}

function makeCustomer(): User
{
    $role = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('admin with customers.edit can reset a customer password', function () {
    $admin = makeAdmin(['customers.edit']);
    $customer = makeCustomer();

    $this->actingAs($admin)
        ->post("/admin/customers/{$customer->id}/reset-password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'must_change_password' => false,
        ])
        ->assertRedirect();

    expect(Hash::check('newpassword123', $customer->fresh()->password))->toBeTrue();
});

test('non-admin user without customers.edit gets 403', function () {
    // Gate::before grants ALL admin-role users super-admin access. To test
    // the permission:customers.edit guard, we need a non-admin user who
    // has admin.access (so they can enter the /admin prefix) but lacks customers.edit.
    $restrictedRole = Role::firstOrCreate(['name' => 'support', 'guard_name' => 'web']);
    $permission = Permission::firstOrCreate(['name' => 'admin.access', 'guard_name' => 'web']);
    $restrictedRole->givePermissionTo($permission);

    $user = User::factory()->create();
    $user->assignRole($restrictedRole);

    $customer = makeCustomer();

    $this->actingAs($user)
        ->post("/admin/customers/{$customer->id}/reset-password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
        ->assertStatus(403);
});

test('cannot reset password of a non-customer user', function () {
    $admin = makeAdmin(['customers.edit']);
    $nonCustomer = User::factory()->create(); // no customer role

    $this->actingAs($admin)
        ->post("/admin/customers/{$nonCustomer->id}/reset-password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
        ->assertStatus(403);
});

test('must_change_password flag is saved when requested', function () {
    $admin = makeAdmin(['customers.edit']);
    $customer = makeCustomer();

    $this->actingAs($admin)
        ->post("/admin/customers/{$customer->id}/reset-password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'must_change_password' => true,
        ])
        ->assertRedirect();

    expect($customer->fresh()->must_change_password)->toBeTrue();
});

test('customer can log in with the new password after admin reset', function () {
    $admin = makeAdmin(['customers.edit']);
    $customer = makeCustomer();

    $this->actingAs($admin)
        ->post("/admin/customers/{$customer->id}/reset-password", [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
            'must_change_password' => false,
        ]);

    $this->post(route('login'), [
        'email' => $customer->email,
        'password' => 'brand-new-password',
    ])->assertRedirect();

    $this->assertAuthenticated();
});

test('password reset requires password confirmation to match', function () {
    $admin = makeAdmin(['customers.edit']);
    $customer = makeCustomer();

    $this->actingAs($admin)
        ->post("/admin/customers/{$customer->id}/reset-password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'doesnotmatch',
        ])
        ->assertSessionHasErrors('password');
});

test('unauthenticated user cannot reset customer password', function () {
    $customer = makeCustomer();

    $this->post("/admin/customers/{$customer->id}/reset-password", [
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ])->assertRedirect(route('login'));
});

test('customer is redirected to change-password route when must_change_password is true', function () {
    $customer = makeCustomer();
    $customer->update(['must_change_password' => true]);

    $this->actingAs($customer)
        ->get(route('shop.index'))
        ->assertRedirect(route('change-password.show'));
});

test('customer can update their forced password via change-password route', function () {
    $customer = makeCustomer();
    $customer->update(['must_change_password' => true]);

    $this->actingAs($customer)
        ->post(route('change-password.update'), [
            'password' => 'mynewpassword',
            'password_confirmation' => 'mynewpassword',
        ])
        ->assertRedirect(route('shop.index'));

    expect($customer->fresh()->must_change_password)->toBeFalse();
    expect(Hash::check('mynewpassword', $customer->fresh()->password))->toBeTrue();
});
