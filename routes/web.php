<?php

use Illuminate\Support\Facades\Route;
use Modules\Catalog\Http\Controllers\HomeController;
use Modules\Catalog\Http\Controllers\ProductController;
use Modules\Ordering\Http\Controllers\CartController;
use Modules\Ordering\Http\Controllers\CheckoutController;
use Modules\Ordering\Http\Controllers\OrderController;
use Modules\Payment\Http\Controllers\WebhookController;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/shop', [ProductController::class, 'index'])->name('shop.index');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
Route::patch('/cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');

Route::middleware(['auth', 'verified', 'role:customer'])->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('/checkout/complete/{order}', [CheckoutController::class, 'complete'])->name('checkout.complete');
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{order}/confirm-payment', [OrderController::class, 'confirmPayment'])->name('orders.confirm-payment');
});

Route::post('/webhooks/midtrans', [WebhookController::class, 'handle'])->name('webhooks.midtrans');

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
