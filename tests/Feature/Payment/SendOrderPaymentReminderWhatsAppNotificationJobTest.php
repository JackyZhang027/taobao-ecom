<?php

use App\Jobs\SendOrderPaymentReminderWhatsAppNotification;
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
    ShopSetting::set('whatsapp_sender', '62800000000');
});

test('it sends a reminder when the number exists on whatsapp', function () {
    Http::fake([
        '*/check-number' => Http::response(['status' => true, 'msg' => ['exists' => true]]),
        '*/send-message' => Http::response(['status' => true]),
    ]);

    $order = Order::factory()->pending()->create(['recipient_phone' => '0812345678']);

    (new SendOrderPaymentReminderWhatsAppNotification($order, 60))->handle(app(WhatsAppService::class));

    Http::assertSent(function ($request) use ($order) {
        return str_contains((string) $request->url(), '/send-message')
            && $request['number'] === '62812345678'
            && str_contains($request['message'], $order->order_number)
            && str_contains($request['message'], route('orders.show', $order));
    });
});

test('it does not send a reminder when the number has no whatsapp', function () {
    Http::fake([
        '*/check-number' => Http::response(['status' => true, 'msg' => ['exists' => false]]),
        '*/send-message' => Http::response(['status' => true]),
    ]);

    $order = Order::factory()->pending()->create();

    (new SendOrderPaymentReminderWhatsAppNotification($order, 60))->handle(app(WhatsAppService::class));

    Http::assertNotSent(fn ($request) => str_contains((string) $request->url(), '/send-message'));
});

test('it does not send a reminder when the check-number call fails', function () {
    Http::fake([
        '*/check-number' => Http::response(null, 500),
        '*/send-message' => Http::response(['status' => true]),
    ]);

    $order = Order::factory()->pending()->create();

    (new SendOrderPaymentReminderWhatsAppNotification($order, 60))->handle(app(WhatsAppService::class));

    Http::assertNotSent(fn ($request) => str_contains((string) $request->url(), '/send-message'));
});

test('it does not send a reminder when the order is no longer pending', function () {
    Http::fake();

    $order = Order::factory()->confirmed()->create();

    (new SendOrderPaymentReminderWhatsAppNotification($order, 60))->handle(app(WhatsAppService::class));

    Http::assertNothingSent();
});

test('it uses a custom template with placeholders when configured', function () {
    ShopSetting::set('whatsapp_payment_reminder_template', 'Reminder {order_no} for {customer_name}, pay via {link}');
    Http::fake([
        '*/check-number' => Http::response(['status' => true, 'msg' => ['exists' => true]]),
        '*/send-message' => Http::response(['status' => true]),
    ]);

    $order = Order::factory()->pending()->create(['recipient_phone' => '0812345678']);

    (new SendOrderPaymentReminderWhatsAppNotification($order, 60))->handle(app(WhatsAppService::class));

    Http::assertSent(function ($request) use ($order) {
        return str_contains((string) $request->url(), '/send-message')
            && $request['message'] === "Reminder {$order->order_number} for {$order->recipient_name}, pay via ".route('orders.show', $order)
            && ! str_contains($request['message'], 'Payment Reminder');
    });
});

test('it leaves an unknown placeholder untouched in a custom template', function () {
    ShopSetting::set('whatsapp_payment_reminder_template', 'Order {order_no} code {not_a_real_token}');
    Http::fake([
        '*/check-number' => Http::response(['status' => true, 'msg' => ['exists' => true]]),
        '*/send-message' => Http::response(['status' => true]),
    ]);

    $order = Order::factory()->pending()->create(['recipient_phone' => '0812345678']);

    (new SendOrderPaymentReminderWhatsAppNotification($order, 60))->handle(app(WhatsAppService::class));

    Http::assertSent(fn ($request) => str_contains((string) $request->url(), '/send-message') && str_contains($request['message'], '{not_a_real_token}'));
});
