<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductTranslation;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function gridAdmin(array $permissions = ['products.view']): User
{
    $role = Role::firstOrCreate(['name' => 'grid-admin-'.uniqid(), 'guard_name' => 'web']);
    foreach (array_merge(['admin.access'], $permissions) as $name) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']));
    }
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function makeGridProduct(array $attrs = [], ?string $name = null): Product
{
    $product = Product::create(array_merge([
        'slug' => 'grid-product-'.uniqid(),
        'price' => 100,
        'delivery_rate_batam' => 20000,
        'delivery_rate_jakarta' => 30000,
        'is_active' => true,
        'sort_order' => 0,
    ], $attrs));

    if ($name !== null) {
        ProductTranslation::create([
            'product_id' => $product->id,
            'locale' => 'en',
            'name' => $name,
        ]);
    }

    return $product;
}

function gridIds(\Illuminate\Testing\TestResponse $response): array
{
    return collect($response->json('data'))->pluck('id')->all();
}

// ─── Authorization ───────────────────────────────────────────────────────────

test('guests are redirected to login from the grid endpoint', function () {
    $this->get('/admin/products/grid')->assertRedirect('/login');
});

test('users without products.view cannot access grid or datatable', function () {
    $user = gridAdmin([]);

    $this->actingAs($user)->getJson('/admin/products/grid')->assertForbidden();
    $this->actingAs($user)->getJson('/admin/products/datatable?draw=1&start=0&length=25')->assertForbidden();
});

// ─── Grid response shape ─────────────────────────────────────────────────────

test('grid returns a paginated list of products', function () {
    makeGridProduct([], 'Test Product');

    $this->actingAs(gridAdmin())
        ->getJson('/admin/products/grid')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                ['id', 'slug', 'name', 'image', 'price_display', 'final_price_idr', 'is_active', 'variants_count'],
            ],
            'current_page',
            'last_page',
            'total',
        ])
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.name', 'Test Product');
});

// ─── Status filter ───────────────────────────────────────────────────────────

test('status filter returns only matching products', function () {
    $active = makeGridProduct(['is_active' => true]);
    $inactive = makeGridProduct(['is_active' => false]);
    $admin = gridAdmin();

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?status=inactive')->assertOk();
    expect(gridIds($response))->toBe([$inactive->id]);

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?status=active')->assertOk();
    expect(gridIds($response))->toBe([$active->id]);

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?status=all')->assertOk();
    expect(gridIds($response))->toHaveCount(2);
});

test('status filter applies to the datatable endpoint', function () {
    makeGridProduct(['is_active' => true]);
    makeGridProduct(['is_active' => false]);

    $this->actingAs(gridAdmin())
        ->getJson('/admin/products/datatable?draw=1&start=0&length=25&status=inactive')
        ->assertOk()
        ->assertJsonPath('recordsFiltered', 1);
});

// ─── Search filter ───────────────────────────────────────────────────────────

test('search matches translation name and slug', function () {
    $byName = makeGridProduct([], 'Red Sneakers');
    $bySlug = makeGridProduct(['slug' => 'sneaker-blue-special'], 'Something Else');
    makeGridProduct([], 'Leather Bag');
    $admin = gridAdmin();

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?search=Red+Sneakers')->assertOk();
    expect(gridIds($response))->toBe([$byName->id]);

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?search=sneaker-blue')->assertOk();
    expect(gridIds($response))->toBe([$bySlug->id]);

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?search=nomatchxyz')->assertOk();
    expect(gridIds($response))->toBeEmpty();
});

// ─── Category filter ─────────────────────────────────────────────────────────

test('category filter returns only products in the category', function () {
    $category = Category::create(['name' => 'Shoes', 'slug' => 'shoes']);
    $inCategory = makeGridProduct();
    $inCategory->categories()->attach($category->id);
    makeGridProduct();
    $admin = gridAdmin();

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?category_id='.$category->id)->assertOk();
    expect(gridIds($response))->toBe([$inCategory->id]);

    $response = $this->actingAs($admin)->getJson('/admin/products/grid?category_id=all')->assertOk();
    expect(gridIds($response))->toHaveCount(2);
});

test('filters combine', function () {
    $match = makeGridProduct(['is_active' => false], 'Combo Match');
    makeGridProduct(['is_active' => true], 'Combo Match');
    makeGridProduct(['is_active' => false], 'Different Name');

    $response = $this->actingAs(gridAdmin())
        ->getJson('/admin/products/grid?status=inactive&search=Combo')
        ->assertOk();
    expect(gridIds($response))->toBe([$match->id]);
});
