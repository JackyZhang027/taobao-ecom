<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductVariant;
use Modules\Delivery\Models\DeliveryRate;
use Modules\Ordering\Models\Address;
use Modules\Ordering\Models\Cart;
use Modules\Ordering\Models\CartItem;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Services\AddressService;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    config(['midtrans.server_key' => 'test-server-key']);

    DeliveryRate::query()->delete();
    DeliveryRate::create(['rate' => 1, 'is_active' => true]);
});

function addressTestCustomer(): User
{
    $role = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function addressTestCartFor(User $user): Cart
{
    $product = Product::create([
        'slug' => 'test-product-'.uniqid(),
        'price' => 100,
        'delivery_rate_batam' => 20000,
        'delivery_rate_jakarta' => 30000,
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'SKU-'.uniqid(),
        'price' => 50,
        'delivery_rate_batam' => 15000,
        'delivery_rate_jakarta' => 25000,
        'stock' => 10,
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $cart = Cart::create(['user_id' => $user->id]);
    CartItem::create([
        'cart_id' => $cart->id,
        'product_variant_id' => $variant->id,
        'product_id' => null,
        'quantity' => 1,
    ]);

    return $cart;
}

// ─── AddressService: single-default invariant ────────────────────────────────

test('first address for a user is automatically marked default', function () {
    $user = addressTestCustomer();

    $address = app(AddressService::class)->create($user, [
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
        'province' => 'Kepulauan Riau',
        'postal_code' => '29432',
    ]);

    expect($address->is_default)->toBeTrue();
});

test('creating a second default address unsets the previous default', function () {
    $user = addressTestCustomer();
    $service = app(AddressService::class);

    $first = $service->create($user, [
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
    ]);

    $second = $service->create($user, [
        'recipient_name' => 'John Doe',
        'recipient_phone' => '08199999999',
        'street_address' => 'Jl. Test No. 2',
        'city' => 'Jakarta',
        'is_default' => true,
    ]);

    expect($first->fresh()->is_default)->toBeFalse();
    expect($second->fresh()->is_default)->toBeTrue();
    expect($user->addresses()->where('is_default', true)->count())->toBe(1);
});

test('deleting the default address promotes the next remaining address to default', function () {
    $user = addressTestCustomer();
    $service = app(AddressService::class);

    $first = $service->create($user, [
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
    ]);
    $second = $service->create($user, [
        'recipient_name' => 'John Doe',
        'recipient_phone' => '08199999999',
        'street_address' => 'Jl. Test No. 2',
        'city' => 'Jakarta',
    ]);

    $service->delete($first);

    expect($second->fresh()->is_default)->toBeTrue();
});

test('deleting the last remaining address leaves the user with zero addresses', function () {
    $user = addressTestCustomer();
    $service = app(AddressService::class);

    $only = $service->create($user, [
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
    ]);

    $service->delete($only);

    expect($user->addresses()->count())->toBe(0);
});

// ─── AddressController endpoints ─────────────────────────────────────────────

test('addresses.index renders for an authenticated customer', function () {
    $user = addressTestCustomer();

    $this->actingAs($user)
        ->get(route('addresses.index'))
        ->assertOk();
});

test('a non-owner cannot update, delete, or set-default another user\'s address', function () {
    $owner = addressTestCustomer();
    $address = app(AddressService::class)->create($owner, [
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
    ]);

    $other = addressTestCustomer();

    $this->actingAs($other)
        ->patch(route('addresses.update', $address), ['recipient_name' => 'Hacked'])
        ->assertForbidden();

    $this->actingAs($other)
        ->patch(route('addresses.set-default', $address))
        ->assertForbidden();

    $this->actingAs($other)
        ->delete(route('addresses.destroy', $address))
        ->assertForbidden();
});

// ─── Checkout integration ────────────────────────────────────────────────────

test('checkout.store with a saved address_id creates an order snapshot independent of later address edits', function () {
    $user = addressTestCustomer();
    addressTestCartFor($user);

    $address = app(AddressService::class)->create($user, [
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
        'province' => 'Kepulauan Riau',
        'postal_code' => '29432',
    ]);

    $this->actingAs($user)
        ->post(route('checkout.store'), ['address_id' => $address->id])
        ->assertRedirect();

    $order = Order::where('user_id', $user->id)->firstOrFail();
    expect($order->recipient_name)->toBe('Jane Doe');
    expect($order->street_address)->toBe('Jl. Test No. 1');
    expect($order->city)->toBe('Batam');

    $address->update(['recipient_name' => 'Changed Name', 'street_address' => 'Changed Street']);

    expect($order->fresh()->recipient_name)->toBe('Jane Doe');
    expect($order->fresh()->street_address)->toBe('Jl. Test No. 1');
});

test('checkout.store rejects an address_id belonging to another user', function () {
    $owner = addressTestCustomer();
    $address = app(AddressService::class)->create($owner, [
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08123456789',
        'street_address' => 'Jl. Test No. 1',
        'city' => 'Batam',
    ]);

    $attacker = addressTestCustomer();
    addressTestCartFor($attacker);

    $this->actingAs($attacker)
        ->post(route('checkout.store'), ['address_id' => $address->id])
        ->assertSessionHasErrors('address_id');
});

test('checkout.store fails validation when address_id is missing', function () {
    $user = addressTestCustomer();
    addressTestCartFor($user);

    $this->actingAs($user)
        ->post(route('checkout.store'), [])
        ->assertSessionHasErrors(['address_id']);
});

test('addresses.store creates a saved address for the authenticated user', function () {
    $user = addressTestCustomer();

    $this->actingAs($user)
        ->post(route('addresses.store'), [
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '08123456789',
            'street_address' => 'Jl. Test No. 1',
            'city' => 'Batam',
            'province' => 'Kepulauan Riau',
            'postal_code' => '29432',
        ])
        ->assertRedirect();

    expect(Address::where('user_id', $user->id)->count())->toBe(1);
    expect(Address::where('user_id', $user->id)->first()->is_default)->toBeTrue();
});
