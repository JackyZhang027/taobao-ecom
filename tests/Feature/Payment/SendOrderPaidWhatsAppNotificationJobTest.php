<?php

use App\Jobs\SendOrderPaidWhatsAppNotification;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Admin\Models\ShopSetting;
use Modules\Ordering\Models\Order;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'whatsapp.base_url' => 'https://mpwa.smartappscare.com',
        'whatsapp.api_key' => 'test-api-key',
    ]);
});

test('it sends a whatsapp message to every configured admin number', function () {
    ShopSetting::set('whatsapp_sender', '62800000000');
    ShopSetting::set('whatsapp_admin_numbers', '628111111111, 628222222222');
    Http::fake(['*/send-message' => Http::response(['status' => true])]);

    $order = Order::factory()->confirmed()->create();

    (new SendOrderPaidWhatsAppNotification($order))->handle(app(WhatsAppService::class));

    Http::assertSentCount(2);
    Http::assertSent(function ($request) use ($order) {
        return $request['number'] === '628111111111'
            && str_contains($request['message'], $order->order_number);
    });
    Http::assertSent(fn ($request) => $request['number'] === '628222222222');
});

test('it does nothing when no admin numbers are configured', function () {
    Http::fake();

    $order = Order::factory()->confirmed()->create();

    (new SendOrderPaidWhatsAppNotification($order))->handle(app(WhatsAppService::class));

    Http::assertNothingSent();
});
