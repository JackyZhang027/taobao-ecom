<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Ordering\Models\Order;
use Modules\Payment\Models\Payment;
use Modules\Payment\Services\PaymentService;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    // Suppress Midtrans config warnings — server key is intentionally blank in tests.
    config(['midtrans.server_key' => 'test-server-key']);
});

function stalePaymentPayload(Payment $payment, string $status): array
{
    return [
        'order_id' => $payment->midtrans_order_id,
        'status_code' => '200',
        'gross_amount' => number_format($payment->amount, 2, '.', ''),
        'transaction_status' => $status,
    ];
}

// ─── Stale (superseded) payments must not cancel the order ───────────────────

test('expire webhook for a superseded payment does not cancel a pending order with a newer payment', function () {
    $order = Order::factory()->pending()->create();
    $oldPayment = Payment::factory()->pending()->for($order)->create();
    Payment::factory()->pending()->for($order)->create();

    app(PaymentService::class)->handleWebhook(stalePaymentPayload($oldPayment, 'expire'));

    expect($order->fresh()->status)->toBe('pending');
    expect($oldPayment->fresh()->status)->toBe('expire'); // status still recorded
});

test('expire webhook for a superseded payment does not cancel an order already paid on the newer payment', function () {
    $order = Order::factory()->confirmed()->create();
    $oldPayment = Payment::factory()->pending()->for($order)->create();
    Payment::factory()->settlement()->for($order)->create();

    app(PaymentService::class)->handleWebhook(stalePaymentPayload($oldPayment, 'expire'));

    expect($order->fresh()->status)->toBe('confirmed');
});

test('cancel webhook for a superseded payment does not cancel the order', function () {
    $order = Order::factory()->pending()->create();
    $oldPayment = Payment::factory()->pending()->for($order)->create();
    Payment::factory()->pending()->for($order)->create();

    app(PaymentService::class)->handleWebhook(stalePaymentPayload($oldPayment, 'cancel'));

    expect($order->fresh()->status)->toBe('pending');
});

// ─── Latest payment still drives order state ─────────────────────────────────

test('settlement webhook for the latest payment confirms the order', function () {
    $order = Order::factory()->pending()->create();
    Payment::factory()->cancelled()->for($order)->create();
    $latest = Payment::factory()->pending()->for($order)->create();

    app(PaymentService::class)->handleWebhook(stalePaymentPayload($latest, 'settlement'));

    expect($order->fresh()->status)->toBe('confirmed');
    expect($latest->fresh()->status)->toBe('settlement');
});

test('expire webhook for the latest payment still cancels a pending order', function () {
    $order = Order::factory()->pending()->create();
    $latest = Payment::factory()->pending()->for($order)->create();

    app(PaymentService::class)->handleWebhook(stalePaymentPayload($latest, 'expire'));

    expect($order->fresh()->status)->toBe('cancelled');
});

test('settlement webhook for a superseded payment still confirms the order — money was received', function () {
    $order = Order::factory()->pending()->create();
    $oldPayment = Payment::factory()->pending()->for($order)->create();
    Payment::factory()->pending()->for($order)->create();

    app(PaymentService::class)->handleWebhook(stalePaymentPayload($oldPayment, 'settlement'));

    expect($order->fresh()->status)->toBe('confirmed');
});

// ─── Out-of-order notifications must not regress a settled payment ───────────

test('late pending webhook does not regress a settled payment', function () {
    $order = Order::factory()->confirmed()->create();
    $payment = Payment::factory()->settlement()->for($order)->create();

    app(PaymentService::class)->handleWebhook(stalePaymentPayload($payment, 'pending'));

    expect($payment->fresh()->status)->toBe('settlement');
    expect($order->fresh()->status)->toBe('confirmed');
});
