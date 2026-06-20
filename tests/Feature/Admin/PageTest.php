<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Page;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function createPageAdminUser(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $permissions = [
        'admin.access',
        'pages.view',
        'pages.create',
        'pages.edit',
        'pages.delete',
    ];

    foreach ($permissions as $name) {
        $permission = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

    $user = User::factory()->create();
    $user->assignRole($adminRole);

    return $user;
}

function pageData(array $overrides = []): array
{
    return array_merge([
        'slug' => 'shipping-policy',
        'is_active' => true,
        'translations' => [
            'en' => ['title' => 'Shipping Policy', 'content' => '<p>We ship worldwide.</p>'],
            'id' => ['title' => 'Kebijakan Pengiriman', 'content' => '<p>Kami mengirim ke seluruh dunia.</p>'],
        ],
    ], $overrides);
}

test('admin can view pages index', function () {
    $admin = createPageAdminUser();

    $response = $this->actingAs($admin)->get('/admin/settings/pages');

    $response->assertOk();
});

test('admin can create a page with translations', function () {
    $admin = createPageAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/pages', pageData());

    $response->assertRedirect('/admin/settings/pages');
    $this->assertDatabaseHas('pages', ['slug' => 'shipping-policy']);
    $this->assertDatabaseHas('page_translations', ['locale' => 'en', 'title' => 'Shipping Policy']);
    $this->assertDatabaseHas('page_translations', ['locale' => 'id', 'title' => 'Kebijakan Pengiriman']);
});

test('creating a page requires an english title', function () {
    $admin = createPageAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/pages', pageData([
        'translations' => ['en' => ['title' => '', 'content' => '']],
    ]));

    $response->assertSessionHasErrors('translations.en.title');
});

test('page slug must be unique', function () {
    $admin = createPageAdminUser();
    $this->actingAs($admin)->post('/admin/settings/pages', pageData());

    $response = $this->actingAs($admin)->post('/admin/settings/pages', pageData());

    $response->assertSessionHasErrors('slug');
});

test('admin can update a page and its translations', function () {
    $admin = createPageAdminUser();
    $this->actingAs($admin)->post('/admin/settings/pages', pageData());
    $page = Page::where('slug', 'shipping-policy')->first();

    $response = $this->actingAs($admin)->put("/admin/settings/pages/{$page->id}", pageData([
        'translations' => [
            'en' => ['title' => 'Updated Shipping Policy', 'content' => '<p>Updated.</p>'],
        ],
    ]));

    $response->assertRedirect('/admin/settings/pages');
    $this->assertDatabaseHas('page_translations', ['page_id' => $page->id, 'locale' => 'en', 'title' => 'Updated Shipping Policy']);
});

test('admin can delete a page', function () {
    $admin = createPageAdminUser();
    $this->actingAs($admin)->post('/admin/settings/pages', pageData());
    $page = Page::where('slug', 'shipping-policy')->first();

    $response = $this->actingAs($admin)->delete("/admin/settings/pages/{$page->id}");

    $response->assertRedirect('/admin/settings/pages');
    $this->assertDatabaseMissing('pages', ['id' => $page->id]);
    $this->assertDatabaseMissing('page_translations', ['page_id' => $page->id]);
});

test('public page route resolves the active locale with fallback to english', function () {
    $admin = createPageAdminUser();
    $this->actingAs($admin)->post('/admin/settings/pages', pageData());

    app()->setLocale('id');
    $response = $this->get('/pages/shipping-policy');
    $response->assertOk();

    app()->setLocale('fr');
    $response = $this->get('/pages/shipping-policy');
    $response->assertOk();
});

test('public page route 404s for inactive pages', function () {
    $admin = createPageAdminUser();
    $this->actingAs($admin)->post('/admin/settings/pages', pageData(['is_active' => false]));

    $response = $this->get('/pages/shipping-policy');

    $response->assertNotFound();
});

test('admin can assign a page to a footer section', function () {
    $admin = createPageAdminUser();

    $this->actingAs($admin)->post('/admin/settings/pages', pageData(['footer_section' => 'help', 'sort_order' => 5]));

    $this->assertDatabaseHas('pages', ['slug' => 'shipping-policy', 'footer_section' => 'help', 'sort_order' => 5]);
});

test('footer_section must be one of the allowed values', function () {
    $admin = createPageAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/pages', pageData(['footer_section' => 'invalid-section']));

    $response->assertSessionHasErrors('footer_section');
});

test('pages assigned to a footer section are shared as footerPages on inertia responses', function () {
    $admin = createPageAdminUser();
    $this->actingAs($admin)->post('/admin/settings/pages', pageData(['footer_section' => 'help', 'sort_order' => 1]));
    $this->actingAs($admin)->post('/admin/settings/pages', pageData([
        'slug' => 'about-us',
        'footer_section' => null,
        'translations' => ['en' => ['title' => 'About Us', 'content' => '']],
    ]));

    $response = $this->get('/');

    $response->assertInertia(fn ($page) => $page
        ->has('footerPages', 1)
        ->where('footerPages.0.slug', 'shipping-policy')
        ->where('footerPages.0.footer_section', 'help')
    );
});
