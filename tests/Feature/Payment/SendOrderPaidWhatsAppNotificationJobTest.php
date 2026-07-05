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

test('it uses a custom template with placeholders when configured', function () {
    ShopSetting::set('whatsapp_sender', '62800000000');
    ShopSetting::set('whatsapp_admin_numbers', '628111111111');
    ShopSetting::set('shop_name', 'Acme Store');
    ShopSetting::set('whatsapp_order_paid_template', 'Custom {order_no} for {customer_name} total Rp {total} via {shop_name}');
    Http::fake(['*/send-message' => Http::response(['status' => true])]);

    $order = Order::factory()->confirmed()->create();

    (new SendOrderPaidWhatsAppNotification($order))->handle(app(WhatsAppService::class));

    Http::assertSent(function ($request) use ($order) {
        return $request['message'] === "Custom {$order->order_number} for {$order->recipient_name} total Rp ".number_format((float) $order->grand_total_idr, 0, ',', '.').' via Acme Store'
            && ! str_contains($request['message'], 'New Paid Order');
    });
});

test('it leaves an unknown placeholder untouched in a custom template', function () {
    ShopSetting::set('whatsapp_sender', '62800000000');
    ShopSetting::set('whatsapp_admin_numbers', '628111111111');
    ShopSetting::set('whatsapp_order_paid_template', 'Order {order_no} code {not_a_real_token}');
    Http::fake(['*/send-message' => Http::response(['status' => true])]);

    $order = Order::factory()->confirmed()->create();

    (new SendOrderPaidWhatsAppNotification($order))->handle(app(WhatsAppService::class));

    Http::assertSent(fn ($request) => str_contains($request['message'], '{not_a_real_token}'));
});
