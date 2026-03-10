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
use Modules\Admin\Http\Controllers\WishlistController as AdminWishlistController;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\JournalEntryController;
use Modules\Accounting\Http\Controllers\LedgerController;
use Modules\Accounting\Http\Controllers\ReportController;

Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('products/datatable', [ProductController::class, 'datatable'])->name('products.datatable');
    Route::resource('products', ProductController::class);
    Route::resource('products.variants', VariantController::class)->shallow();
    
    Route::get('categories/datatable', [CategoryController::class, 'datatable'])->name('categories.datatable');
    Route::resource('categories', CategoryController::class)->except(['show']);
    Route::get('wishlists/datatable', [AdminWishlistController::class, 'datatable'])->name('wishlists.datatable');
    Route::get('wishlists', [AdminWishlistController::class, 'index'])->name('wishlists.index');
    Route::delete('wishlists/{wishlist}', [AdminWishlistController::class, 'destroy'])->name('wishlists.destroy');
    Route::get('orders/datatable', [OrderController::class, 'datatable'])->name('orders.datatable');
    Route::get('orders/create', [OrderController::class, 'create'])->name('orders.create');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
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

    // --- Accounting ---
    // Chart of Accounts
    Route::get('accounting/accounts/datatable', [AccountController::class, 'datatable'])->name('accounting.accounts.datatable');
    Route::resource('accounting/accounts', AccountController::class)->names('accounting.accounts')->except(['show']);

    // Journal Entries
    Route::get('accounting/journals/datatable', [JournalEntryController::class, 'datatable'])->name('accounting.journals.datatable');
    Route::get('accounting/journals/create', [JournalEntryController::class, 'create'])->name('accounting.journals.create');
    Route::post('accounting/journals', [JournalEntryController::class, 'store'])->name('accounting.journals.store');
    Route::get('accounting/journals', [JournalEntryController::class, 'index'])->name('accounting.journals.index');
    Route::get('accounting/journals/{journalEntry}', [JournalEntryController::class, 'show'])->name('accounting.journals.show');
    Route::post('accounting/journals/{journalEntry}/post', [JournalEntryController::class, 'post'])->name('accounting.journals.post');
    Route::post('accounting/journals/{journalEntry}/void', [JournalEntryController::class, 'void'])->name('accounting.journals.void');

    // General Ledger
    Route::get('accounting/ledger', [LedgerController::class, 'index'])->name('accounting.ledger.index');

    // Reports
    Route::get('accounting/reports/trial-balance', [ReportController::class, 'trialBalance'])->name('accounting.reports.trial-balance');
    Route::get('accounting/reports/balance-sheet', [ReportController::class, 'balanceSheet'])->name('accounting.reports.balance-sheet');
    Route::get('accounting/reports/income-statement', [ReportController::class, 'incomeStatement'])->name('accounting.reports.income-statement');
});
