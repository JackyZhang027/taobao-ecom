<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductVariant;
use Modules\Currency\Models\ExchangeRate;
use Modules\Delivery\Models\DeliveryRate;
use Modules\Ordering\Models\Address;
use Modules\Ordering\Models\Cart;
use Modules\Ordering\Models\CartItem;
use Modules\Ordering\Models\Order;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function totalsTestCustomer(): User
{
    $role = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function totalsTestProduct(array $attrs = []): Product
{
    return Product::create(array_merge([
        'slug' => 'totals-product-'.uniqid(),
        'price' => 100,
        'delivery_rate_batam' => 15000,
        'delivery_rate_jakarta' => 25000,
        'is_active' => true,
        'sort_order' => 0,
    ], $attrs));
}

function totalsTestCheckout(User $user): \Illuminate\Testing\TestResponse
{
    $address = Address::create([
        'user_id' => $user->id,
        'recipient_name' => 'Jane',
        'recipient_phone' => '08123456789',
        'street_address' => '1 Test St',
        'city' => 'Batam',
    ]);

    return test()->actingAs($user)->post('/checkout', ['address_id' => $address->id]);
}

// ─── Rounding regression ──────────────────────────────────────────────────────

test('order grand total exactly equals the sum of line subtotals plus shipping', function () {
    // Rate/price chosen so per-unit and per-total rounding used to diverge:
    // 9.99 × 2205 = 22027.95/unit; ×2 = 44055.90 — a naive total-level
    // rounding gives 44056 while truncated per-line prices summed to 44054,
    // which Midtrans rejects (gross_amount must equal the item_details sum).
    ExchangeRate::create(['rate' => 2205, 'is_active' => true]);
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);

    $user = totalsTestCustomer();
    $product = totalsTestProduct(['price' => 9.99]);
    $cart = Cart::create(['user_id' => $user->id, 'session_id' => null]);
    CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'product_variant_id' => null, 'quantity' => 2]);

    totalsTestCheckout($user)->assertRedirect();

    $order = Order::firstOrFail();
    $order->load('lines');

    $lineSum = (float) $order->lines->sum('subtotal_idr');

    expect($order->subtotal_idr)->toBe($lineSum);
    expect($order->grand_total_idr)->toBe($lineSum + $order->shipping_idr);

    // Every stored amount must be whole rupiah so Midtrans (int) casts are exact.
    foreach ([$order->subtotal_idr, $order->shipping_idr, $order->grand_total_idr] as $amount) {
        expect($amount)->toBe(floor($amount));
    }
    foreach ($order->lines as $line) {
        expect((float) $line->unit_price_idr)->toBe(floor($line->unit_price_idr));
        expect((int) $line->unit_price_idr * $line->quantity)->toBe((int) $line->subtotal_idr);
    }

    // The exact comparison Midtrans performs on Snap token creation.
    $midtransItemSum = $order->lines->sum(fn ($l) => (int) $l->unit_price_idr * $l->quantity)
        + (int) $order->shipping_idr;
    expect((int) $order->grand_total_idr)->toBe($midtransItemSum);
});

// ─── Deactivated items are blocked at checkout ────────────────────────────────

test('checkout is blocked when a cart variant has been deactivated', function () {
    ExchangeRate::create(['rate' => 1000, 'is_active' => true]);
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);

    $user = totalsTestCustomer();
    $product = totalsTestProduct();
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TOTALS-SKU-'.uniqid(),
        'price' => 50,
        'delivery_rate_batam' => 15000,
        'delivery_rate_jakarta' => 25000,
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $cart = Cart::create(['user_id' => $user->id, 'session_id' => null]);
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variant->id, 'product_id' => null, 'quantity' => 1]);

    $variant->update(['is_active' => false]);

    totalsTestCheckout($user)->assertSessionHasErrors('cart');
    expect(Order::count())->toBe(0);
});

test('checkout is blocked when a cart product has been deactivated', function () {
    ExchangeRate::create(['rate' => 1000, 'is_active' => true]);
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);

    $user = totalsTestCustomer();
    $product = totalsTestProduct();
    $cart = Cart::create(['user_id' => $user->id, 'session_id' => null]);
    CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'product_variant_id' => null, 'quantity' => 1]);

    $product->update(['is_active' => false]);

    totalsTestCheckout($user)->assertSessionHasErrors('cart');
    expect(Order::count())->toBe(0);
});
