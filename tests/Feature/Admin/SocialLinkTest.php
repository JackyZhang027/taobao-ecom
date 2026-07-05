<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\SocialLink;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function createAdminUser(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $permissions = [
        'admin.access',
        'social_links.view',
        'social_links.create',
        'social_links.edit',
        'social_links.delete',
    ];

    foreach ($permissions as $name) {
        $permission = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

    $user = User::factory()->create();
    $user->assignRole($adminRole);

    return $user;
}

function socialLinkData(array $overrides = []): array
{
    return array_merge([
        'name' => 'Facebook',
        'icon' => 'facebook',
        'url' => 'https://facebook.com/testpage',
        'is_active' => true,
        'sort_order' => 1,
    ], $overrides);
}

test('admin can view social links index', function () {
    $admin = createAdminUser();

    $response = $this->actingAs($admin)->get('/admin/settings/social-links');

    $response->assertOk();
});

test('admin can create a social link', function () {
    $admin = createAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/social-links', socialLinkData());

    $response->assertRedirect('/admin/settings/social-links');
    $this->assertDatabaseHas('social_links', [
        'name' => 'Facebook',
        'icon' => 'facebook',
        'url' => 'https://facebook.com/testpage',
    ]);
});

test('creating a social link requires name', function () {
    $admin = createAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/social-links', socialLinkData(['name' => '']));

    $response->assertSessionHasErrors('name');
});

test('creating a social link requires a valid url', function () {
    $admin = createAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/social-links', socialLinkData(['url' => 'not-a-url']));

    $response->assertSessionHasErrors('url');
});

test('creating a social link requires icon', function () {
    $admin = createAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/social-links', socialLinkData(['icon' => '']));

    $response->assertSessionHasErrors('icon');
});

test('admin can update a social link', function () {
    $admin = createAdminUser();
    $link = SocialLink::create(socialLinkData());

    $response = $this->actingAs($admin)->put("/admin/settings/social-links/{$link->id}", socialLinkData([
        'name' => 'Instagram',
        'icon' => 'instagram',
        'url' => 'https://instagram.com/testpage',
    ]));

    $response->assertRedirect('/admin/settings/social-links');
    $this->assertDatabaseHas('social_links', [
        'id' => $link->id,
        'name' => 'Instagram',
        'icon' => 'instagram',
    ]);
});

test('admin can delete a social link', function () {
    $admin = createAdminUser();
    $link = SocialLink::create(socialLinkData());

    $response = $this->actingAs($admin)->delete("/admin/settings/social-links/{$link->id}");

    $response->assertRedirect('/admin/settings/social-links');
    $this->assertDatabaseMissing('social_links', ['id' => $link->id]);
});

test('only active social links are returned in shared data', function () {
    SocialLink::create(socialLinkData(['name' => 'Active One', 'is_active' => true,  'sort_order' => 1]));
    SocialLink::create(socialLinkData(['name' => 'Inactive',   'is_active' => false, 'sort_order' => 2, 'url' => 'https://facebook.com/inactive']));

    $active = SocialLink::active()->get();

    expect($active)->toHaveCount(1);
    expect($active->first()->name)->toBe('Active One');
});

test('social links are returned ordered by sort_order', function () {
    SocialLink::create(socialLinkData(['name' => 'Third',  'sort_order' => 3, 'url' => 'https://facebook.com/third']));
    SocialLink::create(socialLinkData(['name' => 'First',  'sort_order' => 1, 'url' => 'https://facebook.com/first']));
    SocialLink::create(socialLinkData(['name' => 'Second', 'sort_order' => 2, 'url' => 'https://facebook.com/second']));

    $links = SocialLink::active()->pluck('name')->toArray();

    expect($links)->toBe(['First', 'Second', 'Third']);
});
