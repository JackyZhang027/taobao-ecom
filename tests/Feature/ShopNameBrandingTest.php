<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Admin\Models\ShopSetting;
use Modules\Admin\Services\ShopSettingService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
});

// --- ShopSettingService ---

test('ShopSettingService returns shop name from settings', function () {
    ShopSetting::set('shop_name', 'My Test Shop');
    Cache::flush();

    $service = new ShopSettingService;

    expect($service->shopName())->toBe('My Test Shop');
});

test('ShopSettingService falls back to config app name when setting is absent', function () {
    ShopSetting::where('key', 'shop_name')->delete();
    Cache::flush();

    $service = new ShopSettingService;

    expect($service->shopName())->toBe(config('app.name', 'Shop'));
});

test('ShopSettingService falls back to "Shop" when both setting and config are absent', function () {
    ShopSetting::where('key', 'shop_name')->delete();
    Cache::flush();

    config(['app.name' => null]);

    $service = new ShopSettingService;

    expect($service->shopName())->toBe('Shop');
});

test('ShopSettingService caches settings using versioned cache key', function () {
    ShopSetting::set('shop_name', 'Cached Shop');
    Cache::flush();

    $service = new ShopSettingService;
    $service->shopName(); // prime the cache

    // Simulate a direct DB change without going through ShopSettingController
    ShopSetting::where('key', 'shop_name')->update(['value' => json_encode('New Shop')]);

    // Should still return cached value
    $freshService = new ShopSettingService;
    expect($freshService->shopName())->toBe('Cached Shop');

    // Bumping the cache version invalidates the cache
    Cache::forever('cache_ver_settings', microtime(true));

    $freshService2 = new ShopSettingService;
    expect($freshService2->shopName())->toBe('New Shop');
});

test('ShopSettingService singleton returns same collection instance within a request', function () {
    ShopSetting::set('shop_name', 'Singleton Shop');
    Cache::flush();

    $serviceA = app(ShopSettingService::class);
    $serviceB = app(ShopSettingService::class);

    expect($serviceA)->toBe($serviceB);
    expect($serviceA->shopName())->toBe('Singleton Shop');
});

// --- Inertia shared props ---

test('shop name from settings is shared as name prop in Inertia responses', function () {
    ShopSetting::set('shop_name', 'Branding Shop');
    Cache::flush();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('name', 'Branding Shop')
        );
});

test('name prop falls back to config app name when no shop_name setting exists', function () {
    ShopSetting::where('key', 'shop_name')->delete();
    Cache::flush();

    $expected = config('app.name', 'Shop');

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('name', $expected)
        );
});

test('internal whatsapp settings are not shared with visitors', function () {
    ShopSetting::set('shop_name', 'Leak Test Shop');
    ShopSetting::set('whatsapp_admin_numbers', '628111111111,628222222222');
    ShopSetting::set('whatsapp_sender', '628000000000');
    ShopSetting::set('whatsapp_payment_reminder_template', 'Pay now {link}');
    Cache::flush();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('shopSettings.shop_name', 'Leak Test Shop')
            ->missing('shopSettings.whatsapp_admin_numbers')
            ->missing('shopSettings.whatsapp_sender')
            ->missing('shopSettings.whatsapp_payment_reminder_template')
        );
});

// --- Password reset email ---

test('password reset email subject includes shop name', function () {
    Notification::fake();

    ShopSetting::set('shop_name', 'Email Shop');
    Cache::flush();

    $user = User::factory()->create();
    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) {
        $mail = $notification->toMail(new User);
        expect($mail->subject)->toContain('Email Shop');

        return true;
    });
});

test('password reset email subject falls back gracefully when no shop name is set', function () {
    Notification::fake();

    ShopSetting::where('key', 'shop_name')->delete();
    Cache::flush();

    $user = User::factory()->create();
    $this->post(route('password.email'), ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) {
        $mail = $notification->toMail(new User);
        expect($mail->subject)->toContain('Reset Your Password');

        return true;
    });
});

test('password reset email greeting includes shop name', function () {
    ShopSetting::set('shop_name', 'Greeter Shop');
    Cache::flush();

    $notification = new ResetPasswordNotification('token');
    $user = User::factory()->create();

    $mail = $notification->toMail($user);

    $lineContent = collect($mail->introLines)->implode(' ');
    expect($lineContent)->toContain('Greeter Shop');
});
