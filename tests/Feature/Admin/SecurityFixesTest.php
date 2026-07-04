<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductVariant;
use Modules\Currency\Models\ExchangeRate;
use Modules\Delivery\Models\DeliveryRate;
use Modules\Ordering\Models\Cart;
use Modules\Ordering\Models\CartItem;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSecProduct(array $attrs = []): Product
{
    return Product::create(array_merge([
        'slug' => 'sec-product-'.uniqid(),
        'price' => 100,
        'delivery_rate_batam' => 20000,
        'delivery_rate_jakarta' => 30000,
        'is_active' => true,
        'sort_order' => 0,
    ], $attrs));
}

function makeSecVariant(Product $product, array $attrs = []): ProductVariant
{
    return ProductVariant::create(array_merge([
        'product_id' => $product->id,
        'sku' => 'SEC-SKU-'.uniqid(),
        'price' => 50,
        'delivery_rate_batam' => 15000,
        'delivery_rate_jakarta' => 25000,
        'stock' => 10,
        'is_active' => true,
        'sort_order' => 0,
    ], $attrs));
}

function customerUser(): User
{
    $role = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

/** Grant an actor an admin role limited to the given permissions. */
function limitedAdmin(array $permissions): User
{
    $role = Role::firstOrCreate(['name' => 'limited-'.uniqid(), 'guard_name' => 'web']);
    foreach (array_merge(['admin.access'], $permissions) as $name) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']));
    }
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

// ─── Fix 1: zero-price purchase path ──────────────────────────────────────────

test('cannot add a variant product to the cart via product_id', function () {
    $product = makeSecProduct();
    makeSecVariant($product);

    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1])
        ->assertStatus(422);

    expect(CartItem::count())->toBe(0);
});

test('cannot add an inactive product to the cart', function () {
    $product = makeSecProduct(['is_active' => false]);

    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1])
        ->assertSessionHasErrors('product_id');

    expect(CartItem::count())->toBe(0);
});

test('cannot add a soft-deleted product to the cart', function () {
    $product = makeSecProduct();
    $product->delete();

    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1])
        ->assertSessionHasErrors('product_id');

    expect(CartItem::count())->toBe(0);
});

test('cannot add a variant-less product with no price to the cart', function () {
    $product = makeSecProduct(['price' => 0]);

    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1])
        ->assertStatus(422);

    expect(CartItem::count())->toBe(0);
});

test('can still add a variant-less priced product to the cart', function () {
    $product = makeSecProduct(['price' => 100]);

    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1])
        ->assertRedirect();

    expect(CartItem::where('product_id', $product->id)->exists())->toBeTrue();
});

test('checkout is blocked when a cart item has no price', function () {
    ExchangeRate::create(['rate' => 1000, 'is_active' => true]);
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);

    $user = customerUser();

    // A zero-priced product slipped into the cart directly (bypassing store()).
    $product = makeSecProduct(['price' => 0]);
    $cart = Cart::create(['user_id' => $user->id, 'session_id' => null]);
    CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'product_variant_id' => null, 'quantity' => 1]);

    $this->actingAs($user)->post('/checkout', [
        'recipient_name' => 'Jane',
        'recipient_phone' => '08123456789',
        'street_address' => '1 Test St',
        'city' => 'Batam',
    ])->assertSessionHasErrors('cart');

    expect(\Modules\Ordering\Models\Order::count())->toBe(0);
});

// ─── Fix 2: customer role privilege escalation ────────────────────────────────

test('customer system role cannot be edited', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $customerRole = Role::where('name', 'customer')->first();

    $actor = limitedAdmin(['roles.view', 'roles.edit']);

    $this->actingAs($actor)
        ->get("/admin/roles/{$customerRole->id}/edit")
        ->assertRedirect(route('admin.roles.index'));

    $this->actingAs($actor)
        ->put("/admin/roles/{$customerRole->id}", ['name' => 'customer', 'permissions' => ['roles.view']])
        ->assertSessionHasErrors('error');

    expect($customerRole->fresh()->permissions)->toHaveCount(0);
});

test('a non-system role can still be edited', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);

    // Actor holds admin.access so the self-escalation guard permits granting it.
    $actor = limitedAdmin(['roles.view', 'roles.edit']);

    $this->actingAs($actor)
        ->put("/admin/roles/{$role->id}", ['name' => 'editor-renamed', 'permissions' => []])
        ->assertRedirect(route('admin.roles.index'));

    expect($role->fresh()->name)->toBe('editor-renamed');
});

// ─── Fix 3: per-action resource middleware ────────────────────────────────────

test('view-only admin can reach the products index but not write routes', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $actor = limitedAdmin(['products.view']);

    $product = makeSecProduct();

    $this->actingAs($actor)->get('/admin/products')->assertOk();
    $this->actingAs($actor)->post('/admin/products', [])->assertForbidden();
    $this->actingAs($actor)->delete("/admin/products/{$product->id}")->assertForbidden();
});
