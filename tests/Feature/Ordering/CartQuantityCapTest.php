<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Catalog\Models\Product;
use Modules\Ordering\Models\Cart;
use Modules\Ordering\Models\CartItem;
use Modules\Ordering\Services\CartService;

uses(RefreshDatabase::class);

function capTestProduct(): Product
{
    return Product::create([
        'slug' => 'cap-product-'.uniqid(),
        'price' => 100,
        'delivery_rate_batam' => 15000,
        'delivery_rate_jakarta' => 25000,
        'is_active' => true,
        'sort_order' => 0,
    ]);
}

test('repeated adds clamp the cart line at the maximum quantity', function () {
    $product = capTestProduct();

    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 999])->assertRedirect();
    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 999])->assertRedirect();

    $item = CartItem::firstOrFail();
    expect($item->quantity)->toBe(CartService::MAX_QUANTITY);
});

test('a quantity above the maximum is rejected outright', function () {
    $product = capTestProduct();

    $this->post('/cart', ['product_id' => $product->id, 'quantity' => 1000])
        ->assertSessionHasErrors('quantity');

    expect(CartItem::count())->toBe(0);
});

test('guest cart merge clamps the combined quantity at the maximum', function () {
    $product = capTestProduct();
    $user = User::factory()->create();

    $userCart = Cart::create(['user_id' => $user->id, 'session_id' => null]);
    CartItem::create(['cart_id' => $userCart->id, 'product_id' => $product->id, 'product_variant_id' => null, 'quantity' => 998]);

    $guestCart = Cart::create(['user_id' => null, 'session_id' => 'guest-session-id']);
    CartItem::create(['cart_id' => $guestCart->id, 'product_id' => $product->id, 'product_variant_id' => null, 'quantity' => 5]);

    app(CartService::class)->mergeGuestCart($user, 'guest-session-id');

    $item = CartItem::where('cart_id', $userCart->id)->firstOrFail();
    expect($item->quantity)->toBe(CartService::MAX_QUANTITY);
    expect(Cart::where('session_id', 'guest-session-id')->exists())->toBeFalse();
});
