<?php

use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\JournalEntryController;
use Modules\Accounting\Http\Controllers\LedgerController;
use Modules\Accounting\Http\Controllers\ReportController;
use Modules\Admin\Http\Controllers\AdminUserController;
use Modules\Admin\Http\Controllers\CategoryController;
use Modules\Admin\Http\Controllers\CustomerController;
use Modules\Admin\Http\Controllers\DashboardController;
use Modules\Admin\Http\Controllers\DeliveryRateController;
use Modules\Admin\Http\Controllers\ExchangeRateController;
use Modules\Admin\Http\Controllers\FaqController as AdminFaqController;
use Modules\Admin\Http\Controllers\HeroSlideController;
use Modules\Admin\Http\Controllers\OrderController;
use Modules\Admin\Http\Controllers\PageController as AdminPageController;
use Modules\Admin\Http\Controllers\ProductController;
use Modules\Admin\Http\Controllers\RoleController;
use Modules\Admin\Http\Controllers\ShopSettingController;
use Modules\Admin\Http\Controllers\SocialLinkController;
use Modules\Admin\Http\Controllers\StoreFeatureController;
use Modules\Admin\Http\Controllers\WhatsappSettingController;
use Modules\Admin\Http\Controllers\WishlistController as AdminWishlistController;

Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified', 'permission:admin.access'])->group(function () {

    // Dashboard — no permission middleware here; DashboardController redirects users
    // who lack dashboard.view to the first route they can access.
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // --- Products ---
    Route::get('products/datatable', [ProductController::class, 'datatable'])->name('products.datatable')->middleware('permission:products.view');
    Route::get('products/grid', [ProductController::class, 'grid'])->name('products.grid')->middleware('permission:products.view');
    Route::resource('products', ProductController::class)
        ->middlewareFor(['index', 'show'], 'permission:products.view')
        ->middlewareFor(['create', 'store'], 'permission:products.create')
        ->middlewareFor(['edit', 'update'], 'permission:products.edit')
        ->middlewareFor('destroy', 'permission:products.delete');
    // --- Categories ---
    Route::get('categories/datatable', [CategoryController::class, 'datatable'])->name('categories.datatable')->middleware('permission:categories.view');
    Route::resource('categories', CategoryController::class)->except(['show'])
        ->middlewareFor('index', 'permission:categories.view')
        ->middlewareFor(['create', 'store'], 'permission:categories.create')
        ->middlewareFor(['edit', 'update'], 'permission:categories.edit')
        ->middlewareFor('destroy', 'permission:categories.delete');

    // --- Wishlists ---
    Route::get('wishlists/datatable', [AdminWishlistController::class, 'datatable'])->name('wishlists.datatable')->middleware('permission:wishlists.view');
    Route::get('wishlists', [AdminWishlistController::class, 'index'])->name('wishlists.index')->middleware('permission:wishlists.view');
    Route::delete('wishlists/{wishlist}', [AdminWishlistController::class, 'destroy'])->name('wishlists.destroy')->middleware('permission:wishlists.delete');

    // --- Orders ---
    Route::get('orders/datatable', [OrderController::class, 'datatable'])->name('orders.datatable')->middleware('permission:orders.view');
    Route::get('orders/create', [OrderController::class, 'create'])->name('orders.create')->middleware('permission:orders.create');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store')->middleware('permission:orders.create');
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index')->middleware('permission:orders.view');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show')->middleware('permission:orders.view');
    Route::post('orders/{order}/transition', [OrderController::class, 'transition'])->name('orders.transition')->middleware('permission:orders.edit');

    // --- Exchange Rates ---
    Route::get('exchange-rates/datatable', [ExchangeRateController::class, 'datatable'])->name('exchange-rates.datatable')->middleware('permission:exchange_rates.view');
    Route::get('exchange-rates', [ExchangeRateController::class, 'index'])->name('exchange-rates.index')->middleware('permission:exchange_rates.view');
    Route::post('exchange-rates', [ExchangeRateController::class, 'store'])->name('exchange-rates.store')->middleware('permission:exchange_rates.create');

    // --- Delivery Rates ---
    Route::get('delivery-rates/datatable', [DeliveryRateController::class, 'datatable'])->name('delivery-rates.datatable')->middleware('permission:delivery_rates.view');
    Route::get('delivery-rates', [DeliveryRateController::class, 'index'])->name('delivery-rates.index')->middleware('permission:delivery_rates.view');
    Route::post('delivery-rates', [DeliveryRateController::class, 'store'])->name('delivery-rates.store')->middleware('permission:delivery_rates.create');

    // --- Customers ---
    Route::get('customers/datatable', [CustomerController::class, 'datatable'])->name('customers.datatable')->middleware('permission:customers.view');
    Route::get('customers', [CustomerController::class, 'index'])->name('customers.index')->middleware('permission:customers.view');
    Route::post('customers/{user}/reset-password', [CustomerController::class, 'resetPassword'])->name('customers.reset-password')->middleware('permission:customers.edit');

    // --- Users ---
    Route::get('users/datatable', [AdminUserController::class, 'datatable'])->name('users.datatable')->middleware('permission:users.view');
    Route::resource('users', AdminUserController::class)->except(['show'])
        ->middlewareFor('index', 'permission:users.view')
        ->middlewareFor(['create', 'store'], 'permission:users.create')
        ->middlewareFor(['edit', 'update'], 'permission:users.edit')
        ->middlewareFor('destroy', 'permission:users.delete');

    // --- Roles ---
    Route::get('roles/datatable', [RoleController::class, 'datatable'])->name('roles.datatable')->middleware('permission:roles.view');
    Route::resource('roles', RoleController::class)->except(['show'])
        ->middlewareFor('index', 'permission:roles.view')
        ->middlewareFor(['create', 'store'], 'permission:roles.create')
        ->middlewareFor(['edit', 'update'], 'permission:roles.edit')
        ->middlewareFor('destroy', 'permission:roles.delete');

    // --- Settings ---
    Route::get('settings/shop', [ShopSettingController::class, 'edit'])->name('settings.shop.edit')->middleware('permission:settings.view');
    Route::post('settings/shop', [ShopSettingController::class, 'update'])->name('settings.shop.update')->middleware('permission:settings.edit');

    Route::get('settings/whatsapp', [WhatsappSettingController::class, 'edit'])->name('settings.whatsapp.edit')->middleware('permission:settings.view');
    Route::post('settings/whatsapp', [WhatsappSettingController::class, 'update'])->name('settings.whatsapp.update')->middleware('permission:settings.edit');
    Route::post('settings/whatsapp/qr', [WhatsappSettingController::class, 'generateQr'])->name('settings.whatsapp.qr')->middleware('permission:settings.edit');
    Route::post('settings/whatsapp/logout-device', [WhatsappSettingController::class, 'logoutDevice'])->name('settings.whatsapp.logout-device')->middleware('permission:settings.edit');
    Route::post('settings/whatsapp/check-timelock', [WhatsappSettingController::class, 'checkTimelock'])->name('settings.whatsapp.check-timelock')->middleware('permission:settings.edit');

    Route::get('settings/hero/datatable', [HeroSlideController::class, 'datatable'])->name('settings.hero.datatable')->middleware('permission:hero_slides.view');
    Route::resource('settings/hero', HeroSlideController::class)->names('settings.hero')
        ->middlewareFor(['index', 'show'], 'permission:hero_slides.view')
        ->middlewareFor(['create', 'store'], 'permission:hero_slides.create')
        ->middlewareFor(['edit', 'update'], 'permission:hero_slides.edit')
        ->middlewareFor('destroy', 'permission:hero_slides.delete');

    // --- Social Links ---
    Route::get('settings/social-links/datatable', [SocialLinkController::class, 'datatable'])->name('settings.social-links.datatable')->middleware('permission:social_links.view');
    Route::resource('settings/social-links', SocialLinkController::class)->names('settings.social-links')
        ->middlewareFor(['index', 'show'], 'permission:social_links.view')
        ->middlewareFor(['create', 'store'], 'permission:social_links.create')
        ->middlewareFor(['edit', 'update'], 'permission:social_links.edit')
        ->middlewareFor('destroy', 'permission:social_links.delete');

    // --- Store Features ---
    Route::get('settings/store-features', [StoreFeatureController::class, 'index'])->name('settings.store-features.index')->middleware('permission:store_features.view');
    Route::get('settings/store-features/{storeFeature}/edit', [StoreFeatureController::class, 'edit'])->name('settings.store-features.edit')->middleware('permission:store_features.view');
    Route::put('settings/store-features/{storeFeature}', [StoreFeatureController::class, 'update'])->name('settings.store-features.update')->middleware('permission:store_features.edit');

    // --- Pages ---
    Route::get('settings/pages/datatable', [AdminPageController::class, 'datatable'])->name('settings.pages.datatable')->middleware('permission:pages.view');
    Route::resource('settings/pages', AdminPageController::class)->names('settings.pages')
        ->middlewareFor(['index', 'show'], 'permission:pages.view')
        ->middlewareFor(['create', 'store'], 'permission:pages.create')
        ->middlewareFor(['edit', 'update'], 'permission:pages.edit')
        ->middlewareFor('destroy', 'permission:pages.delete');

    // --- FAQs ---
    Route::get('settings/faqs/datatable', [AdminFaqController::class, 'datatable'])->name('settings.faqs.datatable')->middleware('permission:faqs.view');
    Route::resource('settings/faqs', AdminFaqController::class)->names('settings.faqs')
        ->middlewareFor(['index', 'show'], 'permission:faqs.view')
        ->middlewareFor(['create', 'store'], 'permission:faqs.create')
        ->middlewareFor(['edit', 'update'], 'permission:faqs.edit')
        ->middlewareFor('destroy', 'permission:faqs.delete');

    // --- Accounting ---
    // Chart of Accounts
    Route::get('accounting/accounts/datatable', [AccountController::class, 'datatable'])->name('accounting.accounts.datatable')->middleware('permission:accounting_accounts.view');
    Route::resource('accounting/accounts', AccountController::class)->names('accounting.accounts')->except(['show'])
        ->middlewareFor('index', 'permission:accounting_accounts.view')
        ->middlewareFor(['create', 'store'], 'permission:accounting_accounts.create')
        ->middlewareFor(['edit', 'update'], 'permission:accounting_accounts.edit')
        ->middlewareFor('destroy', 'permission:accounting_accounts.delete');

    // Journal Entries
    Route::get('accounting/journals/datatable', [JournalEntryController::class, 'datatable'])->name('accounting.journals.datatable')->middleware('permission:accounting_journals.view');
    Route::get('accounting/journals/create', [JournalEntryController::class, 'create'])->name('accounting.journals.create')->middleware('permission:accounting_journals.create');
    Route::post('accounting/journals', [JournalEntryController::class, 'store'])->name('accounting.journals.store')->middleware('permission:accounting_journals.create');
    Route::get('accounting/journals', [JournalEntryController::class, 'index'])->name('accounting.journals.index')->middleware('permission:accounting_journals.view');
    Route::get('accounting/journals/{journalEntry}', [JournalEntryController::class, 'show'])->name('accounting.journals.show')->middleware('permission:accounting_journals.view');
    Route::post('accounting/journals/{journalEntry}/post', [JournalEntryController::class, 'post'])->name('accounting.journals.post')->middleware('permission:accounting_journals.edit');
    Route::post('accounting/journals/{journalEntry}/void', [JournalEntryController::class, 'void'])->name('accounting.journals.void')->middleware('permission:accounting_journals.edit');

    // General Ledger
    Route::get('accounting/ledger', [LedgerController::class, 'index'])->name('accounting.ledger.index')->middleware('permission:accounting_ledger.view');

    // Reports
    Route::get('accounting/reports/trial-balance', [ReportController::class, 'trialBalance'])->name('accounting.reports.trial-balance')->middleware('permission:accounting_trial_balance.view');
    Route::get('accounting/reports/balance-sheet', [ReportController::class, 'balanceSheet'])->name('accounting.reports.balance-sheet')->middleware('permission:accounting_balance_sheet.view');
    Route::get('accounting/reports/income-statement', [ReportController::class, 'incomeStatement'])->name('accounting.reports.income-statement')->middleware('permission:accounting_income_statement.view');
});
