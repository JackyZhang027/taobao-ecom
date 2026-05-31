<?php

use App\Http\Controllers\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\ChangePasswordController;
use Illuminate\Support\Facades\Route;
use Modules\Catalog\Http\Controllers\CategoryController;
use Modules\Catalog\Http\Controllers\HomeController;
use Modules\Catalog\Http\Controllers\ProductController;
use Modules\Catalog\Http\Controllers\WishlistController;
use Modules\Ordering\Http\Controllers\CartController;
use Modules\Ordering\Http\Controllers\CheckoutController;
use Modules\Ordering\Http\Controllers\OrderController;
use Modules\Payment\Http\Controllers\WebhookController;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/shop', [ProductController::class, 'index'])->name('shop.index');
Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');

Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');
});

Route::middleware(['auth', 'role:customer'])->group(function () {
    Route::get('/change-password', [ChangePasswordController::class, 'show'])->name('change-password.show');
    Route::post('/change-password', [ChangePasswordController::class, 'update'])->name('change-password.update');
});

Route::middleware(['auth', 'verified', 'role:customer|admin'])->group(function () {
    Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
    Route::post('/wishlist/{product}', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store')->middleware('throttle:10,1');
    Route::get('/checkout/complete/{order}', [CheckoutController::class, 'complete'])->name('checkout.complete');
    Route::get('/checkout/finish', [CheckoutController::class, 'finish'])->name('checkout.finish')->middleware('throttle:10,1');
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{order}/confirm-payment', [OrderController::class, 'confirmPayment'])->name('orders.confirm-payment')->middleware('throttle:5,1');
    Route::post('/orders/{order}/confirm-receipt', [OrderController::class, 'confirmReceipt'])->name('orders.confirm-receipt');

    Route::get('/profile', [CustomerProfileController::class, 'edit'])->name('customer.profile.edit');
    Route::patch('/profile', [CustomerProfileController::class, 'update'])->name('customer.profile.update');
    Route::put('/profile/password', [CustomerProfileController::class, 'updatePassword'])
        ->middleware('throttle:6,1')
        ->name('customer.profile.password');
});

Route::post('/webhooks/midtrans', [WebhookController::class, 'handle'])->name('webhooks.midtrans');

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
