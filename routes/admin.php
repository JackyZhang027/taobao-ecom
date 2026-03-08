<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\DashboardController;
use Modules\Admin\Http\Controllers\ProductController;
use Modules\Admin\Http\Controllers\VariantController;
use Modules\Admin\Http\Controllers\OrderController;
use Modules\Admin\Http\Controllers\ExchangeRateController;
use Modules\Admin\Http\Controllers\AttributeTypeController;
use Modules\Admin\Http\Controllers\AttributeValueController;
use Modules\Admin\Http\Controllers\CategoryController;
use Modules\Admin\Http\Controllers\ShopSettingController;
use Modules\Admin\Http\Controllers\HeroSlideController;

Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('products/datatable', [ProductController::class, 'datatable'])->name('products.datatable');
    Route::resource('products', ProductController::class);
    Route::resource('products.variants', VariantController::class)->shallow();
    
    Route::get('categories/datatable', [CategoryController::class, 'datatable'])->name('categories.datatable');
    Route::resource('categories', CategoryController::class)->except(['show']);
    Route::get('orders/datatable', [OrderController::class, 'datatable'])->name('orders.datatable');
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');
    Route::get('exchange-rates/datatable', [ExchangeRateController::class, 'datatable'])->name('exchange-rates.datatable');
    Route::get('exchange-rates', [ExchangeRateController::class, 'index'])->name('exchange-rates.index');
    Route::post('exchange-rates', [ExchangeRateController::class, 'store'])->name('exchange-rates.store');
    Route::get('attribute-types/datatable', [AttributeTypeController::class, 'datatable'])->name('attribute-types.datatable');
    Route::resource('attribute-types', AttributeTypeController::class)
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
    Route::resource('attribute-types.values', AttributeValueController::class)
        ->shallow()->only(['store', 'update', 'destroy'])
        ->parameters(['values' => 'attributeValue']);
        
    Route::get('settings/shop', [ShopSettingController::class, 'edit'])->name('settings.shop.edit');
    Route::post('settings/shop', [ShopSettingController::class, 'update'])->name('settings.shop.update');

    Route::get('settings/hero/datatable', [HeroSlideController::class, 'datatable'])->name('settings.hero.datatable');
    Route::resource('settings/hero', HeroSlideController::class)->names('settings.hero');
});
