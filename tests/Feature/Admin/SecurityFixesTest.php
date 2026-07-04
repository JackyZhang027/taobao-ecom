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

// ─── Fix 4: managing higher-privileged admin users ────────────────────────────

function fullAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('limited admin cannot update a full admin', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $actor = limitedAdmin(['users.view', 'users.edit']);
    $target = fullAdmin();

    $this->actingAs($actor)->put("/admin/users/{$target->id}", [
        'name' => 'Hijacked',
        'email' => 'hijacked@example.com',
        'role' => 'admin',
    ])->assertForbidden();

    expect($target->fresh()->email)->not->toBe('hijacked@example.com');
});

test('limited admin cannot delete a full admin', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $actor = limitedAdmin(['users.view', 'users.delete']);
    $target = fullAdmin();

    $this->actingAs($actor)->delete("/admin/users/{$target->id}")->assertForbidden();

    expect(User::find($target->id))->not->toBeNull();
});

test('admin user routes return 404 for customer targets', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $actor = limitedAdmin(['users.view', 'users.edit', 'users.delete']);
    $customer = customerUser();

    $this->actingAs($actor)->get("/admin/users/{$customer->id}/edit")->assertNotFound();
    $this->actingAs($actor)->put("/admin/users/{$customer->id}", [
        'name' => 'Promoted',
        'email' => $customer->email,
        'role' => $actor->getRoleNames()->first(),
    ])->assertNotFound();
    $this->actingAs($actor)->delete("/admin/users/{$customer->id}")->assertNotFound();

    expect($customer->fresh()->hasRole('customer'))->toBeTrue();
});

test('full admin can still update a lesser admin', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $actor = fullAdmin();
    $target = limitedAdmin(['users.view']);

    $this->actingAs($actor)->put("/admin/users/{$target->id}", [
        'name' => 'Renamed Admin',
        'email' => $target->email,
        'role' => $target->getRoleNames()->first(),
    ])->assertRedirect(route('admin.users.index'));

    expect($target->fresh()->name)->toBe('Renamed Admin');
});

// ─── Fix 5: inactive variants / inactive parent products in the cart ─────────

test('cannot add an inactive variant to the cart', function () {
    $product = makeSecProduct();
    $variant = makeSecVariant($product, ['is_active' => false]);

    $this->post('/cart', ['product_variant_id' => $variant->id, 'quantity' => 1])
        ->assertStatus(422);

    expect(CartItem::count())->toBe(0);
});

test('cannot add a variant of an inactive product to the cart', function () {
    $product = makeSecProduct(['is_active' => false]);
    $variant = makeSecVariant($product);

    $this->post('/cart', ['product_variant_id' => $variant->id, 'quantity' => 1])
        ->assertStatus(422);

    expect(CartItem::count())->toBe(0);
});

test('can still add an active variant of an active product to the cart', function () {
    $product = makeSecProduct();
    $variant = makeSecVariant($product);

    $this->post('/cart', ['product_variant_id' => $variant->id, 'quantity' => 1])
        ->assertRedirect();

    expect(CartItem::where('product_variant_id', $variant->id)->exists())->toBeTrue();
});

// ─── Fix 6: deleting roles still in use ───────────────────────────────────────

test('a role assigned to users cannot be deleted', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $actor = limitedAdmin(['roles.view', 'roles.delete']);
    $role = Role::create(['name' => 'in-use-role', 'guard_name' => 'web']);
    User::factory()->create()->assignRole($role);

    $this->actingAs($actor)->delete("/admin/roles/{$role->id}");

    expect(Role::find($role->id))->not->toBeNull();
});

test('an unassigned role can be deleted', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    $actor = limitedAdmin(['roles.view', 'roles.delete']);
    $role = Role::create(['name' => 'unused-role', 'guard_name' => 'web']);

    $this->actingAs($actor)->delete("/admin/roles/{$role->id}")
        ->assertRedirect(route('admin.roles.index'));

    expect(Role::find($role->id))->toBeNull();
});

// ─── Fix 7: admin manual orders use the storefront's absolute variant price ──

test('admin manual order prices a variant by its own price, not product + variant', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);
    ExchangeRate::create(['rate' => 1000, 'is_active' => true]);
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);

    $actor = limitedAdmin(['orders.view', 'orders.create']);
    $customer = customerUser();
    $product = makeSecProduct(['price' => 100]);
    $variant = makeSecVariant($product, ['price' => 50]);

    $this->actingAs($actor)->post('/admin/orders', [
        'user_id' => $customer->id,
        'recipient_name' => 'Jane',
        'recipient_phone' => '08123456789',
        'street_address' => '1 Test St',
        'city' => 'Batam',
        'items' => [
            ['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 1],
        ],
    ]);

    $line = \Modules\Ordering\Models\OrderLine::firstWhere('product_variant_id', $variant->id);
    expect($line)->not->toBeNull()
        ->and((float) $line->unit_price_idr)->toBe(50000.0); // 50 RMB × 1000, not (100+50) × 1000
});

// ─── Fix 8: product caches are segmented by locale ────────────────────────────

test('product page cache does not leak one locale into another', function () {
    ExchangeRate::create(['rate' => 1000, 'is_active' => true]);
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);

    $product = makeSecProduct();
    \Modules\Catalog\Models\ProductTranslation::create([
        'product_id' => $product->id, 'locale' => 'en', 'name' => 'Cache EN Name',
    ]);
    \Modules\Catalog\Models\ProductTranslation::create([
        'product_id' => $product->id, 'locale' => 'id', 'name' => 'Cache ID Name',
    ]);

    // First request warms the cache under the default (en) locale.
    $this->get("/products/{$product->slug}")
        ->assertOk()
        ->assertSee('Cache EN Name');

    // Same URL under the id locale must not be served the cached en payload.
    app()->setLocale('id');
    $this->get("/products/{$product->slug}")
        ->assertOk()
        ->assertSee('Cache ID Name');
});
