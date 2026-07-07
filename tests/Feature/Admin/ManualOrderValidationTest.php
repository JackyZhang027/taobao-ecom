<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Catalog\Models\Product;
use Modules\Currency\Models\ExchangeRate;
use Modules\Delivery\Models\DeliveryRate;
use Modules\Ordering\Models\Order;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    Cache::forget('exchange_rate_active');
    Cache::forget('delivery_rate_active');

    ExchangeRate::create(['rate' => 1000, 'is_active' => true]);
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);
});

function manualOrderAdmin(): User
{
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole($role);

    return $admin;
}

function manualOrderCustomer(): User
{
    $role = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $customer = User::factory()->create();
    $customer->assignRole($role);

    return $customer;
}

function manualOrderPayload(User $customer, Product $product): array
{
    return [
        'user_id' => $customer->id,
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
        'items' => [
            ['product_id' => $product->id, 'variant_id' => null, 'quantity' => 1],
        ],
    ];
}

test('admin manual order rejects a variant-less product with no price', function () {
    $product = Product::create([
        'slug' => 'no-price-'.uniqid(),
        'price' => 0,
        'delivery_rate_batam' => 20000,
        'delivery_rate_jakarta' => 0,
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $this->actingAs(manualOrderAdmin())
        ->post(route('admin.orders.store'), manualOrderPayload(manualOrderCustomer(), $product))
        ->assertSessionHasErrors('items.0.product_id');

    expect(Order::count())->toBe(0);
});

test('admin manual order succeeds for a priced variant-less product', function () {
    $product = Product::create([
        'slug' => 'priced-'.uniqid(),
        'price' => 100,
        'delivery_rate_batam' => 20000,
        'delivery_rate_jakarta' => 0,
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $this->actingAs(manualOrderAdmin())
        ->post(route('admin.orders.store'), manualOrderPayload(manualOrderCustomer(), $product))
        ->assertSessionDoesntHaveErrors()
        ->assertRedirect();

    $order = Order::firstOrFail();
    expect($order->subtotal_idr)->toBe(100000.0); // 100 RMB × 1000
    expect($order->grand_total_idr)->toBeGreaterThan(0);
});
