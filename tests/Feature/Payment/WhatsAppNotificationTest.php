<?php

use App\Jobs\SendOrderPaidWhatsAppNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Ordering\Models\Order;
use Modules\Payment\Models\Payment;
use Modules\Payment\Services\PaymentService;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['midtrans.server_key' => 'test-server-key']);
});

function settlementPayload(Payment $payment): array
{
    return [
        'order_id' => $payment->midtrans_order_id,
        'gross_amount' => number_format($payment->amount, 2, '.', ''),
        'transaction_status' => 'settlement',
    ];
}

test('paying an order dispatches the whatsapp notification job', function () {
    Queue::fake();

    $order = Order::factory()->pending()->create();
    $payment = Payment::factory()->pending()->for($order)->create();

    app(PaymentService::class)->handleWebhook(settlementPayload($payment));

    expect($order->fresh()->status)->toBe('confirmed');
    Queue::assertPushed(SendOrderPaidWhatsAppNotification::class, function ($job) use ($order) {
        return $job->order->id === $order->id;
    });
});

test('replaying the same webhook does not dispatch a duplicate notification', function () {
    Queue::fake();

    $order = Order::factory()->confirmed()->create();
    $payment = Payment::factory()->settlement()->for($order)->create();

    app(PaymentService::class)->handleWebhook(settlementPayload($payment));

    expect($order->fresh()->status)->toBe('confirmed');
    Queue::assertNotPushed(SendOrderPaidWhatsAppNotification::class);
});

test('cancelling an order does not dispatch the whatsapp notification job', function () {
    Queue::fake();

    $order = Order::factory()->pending()->create();
    $payment = Payment::factory()->pending()->for($order)->create();

    app(PaymentService::class)->handleWebhook([
        'order_id' => $payment->midtrans_order_id,
        'gross_amount' => number_format($payment->amount, 2, '.', ''),
        'transaction_status' => 'expire',
    ]);

    expect($order->fresh()->status)->toBe('cancelled');
    Queue::assertNotPushed(SendOrderPaidWhatsAppNotification::class);
});
