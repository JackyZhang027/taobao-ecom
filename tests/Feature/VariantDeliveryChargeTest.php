<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductTranslation;
use Modules\Catalog\Models\ProductVariant;
use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\Cart;
use Modules\Ordering\Models\CartItem;
use Modules\Ordering\Services\CartService;
use Modules\Ordering\Services\ShippingService;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(array $attrs = []): Product
{
    return Product::create(array_merge([
        'slug'                    => 'test-product-' . uniqid(),
        'price'                   => 100,
        'delivery_charge_batam'   => 20000,
        'delivery_charge_jakarta' => 30000,
        'is_active'               => true,
        'sort_order'              => 0,
    ], $attrs));
}

function makeVariant(Product $product, array $attrs = []): ProductVariant
{
    return ProductVariant::create(array_merge([
        'product_id'              => $product->id,
        'sku'                     => 'SKU-' . uniqid(),
        'price'                   => 50,
        'delivery_charge_batam'   => 15000,
        'delivery_charge_jakarta' => 25000,
        'stock'                   => 10,
        'is_active'               => true,
        'sort_order'              => 0,
    ], $attrs));
}

function makeCart(): Cart
{
    return Cart::create(['session_id' => 'test-session-' . uniqid(), 'user_id' => null]);
}

function cartWithVariant(ProductVariant $variant): Cart
{
    $cart = makeCart();
    CartItem::create([
        'cart_id'            => $cart->id,
        'product_variant_id' => $variant->id,
        'product_id'         => null,
        'quantity'           => 1,
    ]);
    return $cart;
}

function cartWithProduct(Product $product): Cart
{
    $cart = makeCart();
    CartItem::create([
        'cart_id'            => $cart->id,
        'product_id'         => $product->id,
        'product_variant_id' => null,
        'quantity'           => 1,
    ]);
    return $cart;
}

// ─── ShippingService ──────────────────────────────────────────────────────────

test('ShippingService uses variant delivery_charge_batam when set', function () {
    $product = makeProduct(['delivery_charge_batam' => 20000]);
    $variant = makeVariant($product, ['delivery_charge_batam' => 15000]);
    $cart    = cartWithVariant($variant);

    $shipping = app(ShippingService::class);
    expect($shipping->calculateShippingIdr($cart, 'Batam'))->toBe(15000.0);
});

test('ShippingService uses variant delivery_charge_jakarta when set', function () {
    $product = makeProduct(['delivery_charge_jakarta' => 30000]);
    $variant = makeVariant($product, ['delivery_charge_jakarta' => 25000]);
    $cart    = cartWithVariant($variant);

    $shipping = app(ShippingService::class);
    expect($shipping->calculateShippingIdr($cart, 'Jakarta'))->toBe(25000.0);
});

test('ShippingService falls back to product delivery charge when variant charge is zero', function () {
    $product = makeProduct(['delivery_charge_batam' => 20000]);
    $variant = makeVariant($product, ['delivery_charge_batam' => 0, 'delivery_charge_jakarta' => 0]);
    $cart    = cartWithVariant($variant);

    $shipping = app(ShippingService::class);
    expect($shipping->calculateShippingIdr($cart, 'Batam'))->toBe(20000.0);
});

test('ShippingService uses product delivery charge for non-variant product', function () {
    $product = makeProduct(['delivery_charge_batam' => 20000]);
    $cart    = cartWithProduct($product);

    $shipping = app(ShippingService::class);
    expect($shipping->calculateShippingIdr($cart, 'Batam'))->toBe(20000.0);
});

test('ShippingService multiplies delivery charge by item quantity', function () {
    $product = makeProduct(['delivery_charge_batam' => 20000]);
    $variant = makeVariant($product, ['delivery_charge_batam' => 15000]);
    $cart    = makeCart();
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variant->id, 'product_id' => null, 'quantity' => 3]);

    $shipping = app(ShippingService::class);
    expect($shipping->calculateShippingIdr($cart, 'Batam'))->toBe(45000.0);
});

test('ShippingService sums shipping across multiple items with different quantities', function () {
    $productA = makeProduct(['delivery_charge_batam' => 20000]);
    $variantA = makeVariant($productA, ['delivery_charge_batam' => 15000]);
    $productB = makeProduct(['delivery_charge_batam' => 20000]);
    $variantB = makeVariant($productB, ['delivery_charge_batam' => 20000]);
    $cart     = makeCart();
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variantA->id, 'product_id' => null, 'quantity' => 3]);
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variantB->id, 'product_id' => null, 'quantity' => 2]);

    $shipping = app(ShippingService::class);
    // (3 × 15,000) + (2 × 20,000) = 85,000
    expect($shipping->calculateShippingIdr($cart, 'Batam'))->toBe(85000.0);
});

// ─── CartService::computeTotals ───────────────────────────────────────────────

test('computeTotals grand_total_idr uses variant delivery charge', function () {
    $product = makeProduct(['delivery_charge_batam' => 99000]);
    $variant = makeVariant($product, ['price' => 50, 'delivery_charge_batam' => 15000]);
    $cart    = cartWithVariant($variant);

    $currency = app(CurrencyService::class);
    $shipping = app(ShippingService::class);
    $service  = app(CartService::class);

    $totals = $service->computeTotals($cart, $currency, $shipping, 'Batam');

    expect($totals['shipping_idr'])->toBe(15000.0);
    expect($totals['grand_total_idr'])->toBe($totals['subtotal_idr'] + 15000.0);
});

test('canDeliver is true when variant has delivery charge but product does not', function () {
    $product = makeProduct(['delivery_charge_batam' => 0, 'delivery_charge' => 0]);
    $variant = makeVariant($product, ['delivery_charge_batam' => 15000]);
    $cart    = cartWithVariant($variant);

    $currency = app(CurrencyService::class);
    $shipping = app(ShippingService::class);
    $service  = app(CartService::class);

    $totals = $service->computeTotals($cart, $currency, $shipping, 'Batam');
    expect($totals['can_deliver_batam'])->toBeTrue();
});

// ─── Admin validation ─────────────────────────────────────────────────────────

test('store product without variants requires product price', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.products.store'), [
            'slug'         => 'test-no-price',
            'is_active'    => true,
            'sort_order'   => 0,
            'categories'   => [],
            'translations' => ['en' => ['name' => 'Test']],
        ])
        ->assertSessionHasErrors('price');
});

test('store product without variants requires at least one delivery charge', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.products.store'), [
            'slug'                    => 'test-no-delivery',
            'price'                   => '50',
            'delivery_charge_batam'   => '0',
            'delivery_charge_jakarta' => '0',
            'is_active'               => true,
            'sort_order'              => 0,
            'categories'              => [],
            'translations'            => ['en' => ['name' => 'Test No Delivery']],
        ])
        ->assertSessionHasErrors('delivery_charge_batam');
});

test('store product without variants accepts batam-only delivery charge', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.products.store'), [
            'slug'                    => 'test-batam-only',
            'price'                   => '50',
            'delivery_charge_batam'   => '15000',
            'delivery_charge_jakarta' => '0',
            'is_active'               => true,
            'sort_order'              => 0,
            'categories'              => [1],
            'translations'            => ['en' => ['name' => 'Batam Only']],
        ])
        ->assertSessionDoesntHaveErrors('delivery_charge_batam');
});

test('store product with variants rejects both-zero variant delivery charges', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.products.store'), [
            'slug'              => 'test-variant-zero-delivery',
            'is_active'         => true,
            'sort_order'        => 0,
            'categories'        => [],
            'translations'      => ['en' => ['name' => 'Zero Variant Delivery']],
            'variant_groups'    => [
                ['name' => 'Size', 'has_images' => false, 'options' => ['S']],
            ],
            'variant_overrides' => [
                ['price' => '50', 'delivery_charge_batam' => '0', 'delivery_charge_jakarta' => '0', 'sku' => 'TEST-S', 'is_active' => '1'],
            ],
        ])
        ->assertSessionHasErrors('variant_overrides.0.delivery_charge_batam');
});

test('store product with variants accepts jakarta-only variant delivery charge', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.products.store'), [
            'slug'              => 'test-variant-jakarta-only',
            'is_active'         => true,
            'sort_order'        => 0,
            'categories'        => [1],
            'translations'      => ['en' => ['name' => 'Jakarta Only Variant']],
            'variant_groups'    => [
                ['name' => 'Size', 'has_images' => false, 'options' => ['S']],
            ],
            'variant_overrides' => [
                ['price' => '50', 'delivery_charge_batam' => '0', 'delivery_charge_jakarta' => '25000', 'sku' => 'TEST-S', 'is_active' => '1'],
            ],
        ])
        ->assertSessionDoesntHaveErrors('variant_overrides.0.delivery_charge_batam');
});

test('store product with variants does not require product price', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $response = $this->actingAs($user)
        ->post(route('admin.products.store'), [
            'slug'              => 'test-with-variants',
            'is_active'         => true,
            'sort_order'        => 0,
            'categories'        => [],
            'translations'      => ['en' => ['name' => 'Test Variant Product']],
            'variant_groups'    => [
                ['name' => 'Size', 'has_images' => false, 'options' => ['Small', 'Large']],
            ],
            'variant_overrides' => [
                ['price' => '50', 'delivery_charge_batam' => '15000', 'delivery_charge_jakarta' => '25000', 'sku' => 'TEST-SMALL', 'is_active' => '1'],
                ['price' => '60', 'delivery_charge_batam' => '15000', 'delivery_charge_jakarta' => '25000', 'sku' => 'TEST-LARGE', 'is_active' => '1'],
            ],
        ]);

    $response->assertSessionDoesntHaveErrors('price');
});

test('store product with variants requires variant delivery charges', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.products.store'), [
            'slug'              => 'test-missing-delivery',
            'is_active'         => true,
            'sort_order'        => 0,
            'categories'        => [],
            'translations'      => ['en' => ['name' => 'Missing Delivery']],
            'variant_groups'    => [
                ['name' => 'Size', 'has_images' => false, 'options' => ['S']],
            ],
            'variant_overrides' => [
                ['price' => '50', 'sku' => 'TEST-S', 'is_active' => '1'],
            ],
        ])
        ->assertSessionHasErrors('variant_overrides.0.delivery_charge_batam');
});

// ─── Variant delivery charge stored and retrieved correctly ───────────────────

test('variant delivery charges are persisted and retrievable', function () {
    $product = makeProduct();
    $variant = makeVariant($product, [
        'delivery_charge_batam'   => 18000,
        'delivery_charge_jakarta' => 28000,
    ]);

    $fresh = ProductVariant::find($variant->id);
    expect($fresh->delivery_charge_batam)->toBe(18000.0);
    expect($fresh->delivery_charge_jakarta)->toBe(28000.0);
});
