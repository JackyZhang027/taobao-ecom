<?php

namespace Modules\Payment\Services;

use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;
use Modules\Ordering\Models\Order;
use Modules\Payment\Models\Payment;

class PaymentService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    public function createSnapToken(Order $order): string
    {
        $existing = Payment::where('order_id', $order->id)->first();
        if ($existing) {
            return $existing->snap_token;
        }

        $midtransOrderId = 'ORDER-' . $order->id . '-' . time();

        $items = $order->lines->map(fn ($line) => [
            'id' => (string) $line->id,
            'price' => (int) $line->unit_price_idr,
            'quantity' => $line->quantity,
            'name' => $line->product_name . ($line->variant_name ? ' - ' . $line->variant_name : ''),
        ])->toArray();

        if ((int) $order->shipping_idr > 0) {
            $items[] = [
                'id' => 'SHIPPING',
                'price' => (int) $order->shipping_idr,
                'quantity' => 1,
                'name' => 'Shipping',
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id' => $midtransOrderId,
                'gross_amount' => (int) $order->grand_total_idr,
            ],
            'callbacks' => [
                'finish' => route('checkout.finish'),
            ],
            'customer_details' => [
                'first_name' => $order->recipient_name,
                'phone' => $order->recipient_phone,
                'shipping_address' => [
                    'address' => $order->shipping_address,
                ],
            ],
            'item_details' => $items,
        ];

        $snapToken = Snap::getSnapToken($params);

        Payment::create([
            'order_id' => $order->id,
            'midtrans_order_id' => $midtransOrderId,
            'snap_token' => $snapToken,
            'status' => 'pending',
            'amount' => $order->grand_total_idr,
        ]);

        return $snapToken;
    }

    private const ALLOWED_STATUSES = [
        'pending', 'settlement', 'capture', 'authorize',
        'cancel', 'expire', 'deny', 'refund', 'partial_refund',
    ];

    public function handleWebhook(array $payload): void
    {
        $payment = Payment::where('midtrans_order_id', $payload['order_id'])->first();

        if (! $payment) {
            return;
        }

        // Defense-in-depth: gross_amount in payload is covered by the signature, but
        // verify it also matches our stored amount to catch any edge-case discrepancy.
        if ((int) round((float) ($payload['gross_amount'] ?? 0)) !== (int) round($payment->amount)) {
            \Log::warning('Midtrans webhook amount mismatch', [
                'midtrans_order_id' => $payload['order_id'],
                'expected' => $payment->amount,
                'received' => $payload['gross_amount'] ?? null,
            ]);
            return;
        }

        $transactionStatus = $payload['transaction_status'] ?? '';

        if (! in_array($transactionStatus, self::ALLOWED_STATUSES, true)) {
            \Log::warning('Midtrans webhook unknown transaction_status', [
                'midtrans_order_id' => $payload['order_id'],
                'transaction_status' => $transactionStatus,
            ]);
            return;
        }

        $payment->update([
            'status' => $transactionStatus,
            'gateway_response' => $payload,
        ]);

        $order = $payment->order;

        if (! $order) {
            return;
        }

        match ($transactionStatus) {
            'settlement', 'capture' => $order->update(['status' => 'confirmed']),
            'cancel', 'expire', 'deny' => $order->update(['status' => 'cancelled']),
            default => null,
        };
    }

    /**
     * Fetch live transaction status from Midtrans API and update the order.
     * Used as a fallback when webhooks cannot reach the server (e.g. local dev).
     */
    public function confirmFromTransaction(Order $order): string
    {
        $payment = $order->payment;

        if (!$payment) {
            return 'no_payment';
        }

        $status = Transaction::status($payment->midtrans_order_id);
        $transactionStatus = $status->transaction_status;

        $payment->update([
            'status' => $transactionStatus,
            'gateway_response' => (array) $status,
        ]);

        match ($transactionStatus) {
            'settlement', 'capture' => $order->update(['status' => 'confirmed']),
            'cancel', 'expire', 'deny' => $order->update(['status' => 'cancelled']),
            default => null,
        };

        return $transactionStatus;
    }
}
