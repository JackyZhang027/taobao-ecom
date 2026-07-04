<?php

use App\Jobs\SendOrderPaymentReminderWhatsAppNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Admin\Models\ShopSetting;
use Modules\Ordering\Models\Order;

uses(RefreshDatabase::class);

beforeEach(function () {
    ShopSetting::set('whatsapp_customer_reminder_enabled', '1');
    ShopSetting::set('whatsapp_customer_reminder_schedule', '10m,6h,23h');
});

test('it dispatches a reminder for an order past the first threshold', function () {
    Queue::fake();

    $order = Order::factory()->pending()->create(['created_at' => now()->subMinutes(15)]);

    $this->artisan('orders:send-payment-reminders');

    Queue::assertPushed(SendOrderPaymentReminderWhatsAppNotification::class, function ($job) use ($order) {
        return $job->order->id === $order->id && $job->thresholdMinutes === 10;
    });

    expect($order->fresh())
        ->payment_reminder_count->toBe(1)
        ->last_payment_reminder_at->not->toBeNull();
});

test('it does not dispatch a reminder before the first threshold', function () {
    Queue::fake();

    Order::factory()->pending()->create(['created_at' => now()->subMinutes(5)]);

    $this->artisan('orders:send-payment-reminders');

    Queue::assertNotPushed(SendOrderPaymentReminderWhatsAppNotification::class);
});

test('it does not dispatch once all thresholds are exhausted', function () {
    Queue::fake();

    Order::factory()->pending()->create([
        'created_at' => now()->subDays(2),
        'payment_reminder_count' => 3,
    ]);

    $this->artisan('orders:send-payment-reminders');

    Queue::assertNotPushed(SendOrderPaymentReminderWhatsAppNotification::class);
});

test('it does not dispatch for non-pending orders', function () {
    Queue::fake();

    Order::factory()->confirmed()->create(['created_at' => now()->subDays(2)]);

    $this->artisan('orders:send-payment-reminders');

    Queue::assertNotPushed(SendOrderPaymentReminderWhatsAppNotification::class);
});

test('it does nothing when reminders are disabled', function () {
    Queue::fake();
    ShopSetting::set('whatsapp_customer_reminder_enabled', '0');

    Order::factory()->pending()->create(['created_at' => now()->subDays(2)]);

    $this->artisan('orders:send-payment-reminders');

    Queue::assertNotPushed(SendOrderPaymentReminderWhatsAppNotification::class);
});

test('running the command twice does not double dispatch the same order', function () {
    Queue::fake();

    $order = Order::factory()->pending()->create(['created_at' => now()->subMinutes(15)]);

    $this->artisan('orders:send-payment-reminders');
    $this->artisan('orders:send-payment-reminders');

    Queue::assertPushed(SendOrderPaymentReminderWhatsAppNotification::class, 1);
    expect($order->fresh()->payment_reminder_count)->toBe(1);
});
