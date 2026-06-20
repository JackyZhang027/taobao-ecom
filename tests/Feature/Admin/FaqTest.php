<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Faq;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function createFaqAdminUser(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $permissions = [
        'admin.access',
        'faqs.view',
        'faqs.create',
        'faqs.edit',
        'faqs.delete',
    ];

    foreach ($permissions as $name) {
        $permission = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

    $user = User::factory()->create();
    $user->assignRole($adminRole);

    return $user;
}

function faqData(array $overrides = []): array
{
    return array_merge([
        'sort_order' => 1,
        'is_active' => true,
        'translations' => [
            'en' => ['question' => 'Do you ship internationally?', 'answer' => 'Yes, worldwide.'],
            'id' => ['question' => 'Apakah Anda mengirim ke luar negeri?', 'answer' => 'Ya, ke seluruh dunia.'],
        ],
    ], $overrides);
}

test('admin can view faqs index', function () {
    $admin = createFaqAdminUser();

    $response = $this->actingAs($admin)->get('/admin/settings/faqs');

    $response->assertOk();
});

test('admin can create a faq with translations', function () {
    $admin = createFaqAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/faqs', faqData());

    $response->assertRedirect('/admin/settings/faqs');
    $this->assertDatabaseHas('faqs', ['sort_order' => 1]);
    $this->assertDatabaseHas('faq_translations', ['locale' => 'en', 'question' => 'Do you ship internationally?']);
    $this->assertDatabaseHas('faq_translations', ['locale' => 'id', 'question' => 'Apakah Anda mengirim ke luar negeri?']);
});

test('creating a faq requires an english question', function () {
    $admin = createFaqAdminUser();

    $response = $this->actingAs($admin)->post('/admin/settings/faqs', faqData([
        'translations' => ['en' => ['question' => '', 'answer' => '']],
    ]));

    $response->assertSessionHasErrors('translations.en.question');
});

test('admin can update a faq and its translations', function () {
    $admin = createFaqAdminUser();
    $this->actingAs($admin)->post('/admin/settings/faqs', faqData());
    $faq = Faq::first();

    $response = $this->actingAs($admin)->put("/admin/settings/faqs/{$faq->id}", faqData([
        'translations' => [
            'en' => ['question' => 'Updated question?', 'answer' => 'Updated answer.'],
        ],
    ]));

    $response->assertRedirect('/admin/settings/faqs');
    $this->assertDatabaseHas('faq_translations', ['faq_id' => $faq->id, 'locale' => 'en', 'question' => 'Updated question?']);
});

test('admin can delete a faq', function () {
    $admin = createFaqAdminUser();
    $this->actingAs($admin)->post('/admin/settings/faqs', faqData());
    $faq = Faq::first();

    $response = $this->actingAs($admin)->delete("/admin/settings/faqs/{$faq->id}");

    $response->assertRedirect('/admin/settings/faqs');
    $this->assertDatabaseMissing('faqs', ['id' => $faq->id]);
    $this->assertDatabaseMissing('faq_translations', ['faq_id' => $faq->id]);
});

test('faqs are ordered by sort_order', function () {
    Faq::create(['sort_order' => 2, 'is_active' => true])->translations()->create(['locale' => 'en', 'question' => 'Second', 'answer' => '']);
    Faq::create(['sort_order' => 1, 'is_active' => true])->translations()->create(['locale' => 'en', 'question' => 'First', 'answer' => '']);

    $questions = Faq::where('is_active', true)->orderBy('sort_order')->get()->pluck('question')->toArray();

    expect($questions)->toBe(['First', 'Second']);
});

test('public faq route only returns active faqs', function () {
    $admin = createFaqAdminUser();
    $this->actingAs($admin)->post('/admin/settings/faqs', faqData(['is_active' => true]));
    $this->actingAs($admin)->post('/admin/settings/faqs', faqData([
        'is_active' => false,
        'translations' => ['en' => ['question' => 'Hidden question?', 'answer' => '']],
    ]));

    $response = $this->get('/faq');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('faqs', 1));
});
