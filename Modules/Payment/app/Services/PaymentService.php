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
        $midtransOrderId = 'ORDER-' . $order->id . '-' . time();

        $params = [
            'transaction_details' => [
                'order_id' => $midtransOrderId,
                'gross_amount' => (int) $order->grand_total_idr,
            ],
            'customer_details' => [
                'first_name' => $order->recipient_name,
                'phone' => $order->recipient_phone,
                'shipping_address' => [
                    'address' => $order->shipping_address,
                ],
            ],
            'item_details' => $order->lines->map(fn ($line) => [
                'id' => (string) $line->id,
                'price' => (int) $line->unit_price_idr,
                'quantity' => $line->quantity,
                'name' => $line->product_name . ($line->variant_name ? ' - ' . $line->variant_name : ''),
            ])->toArray(),
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

    public function handleWebhook(array $payload): void
    {
        $payment = Payment::where('midtrans_order_id', $payload['order_id'])->firstOrFail();

        $payment->update([
            'status' => $payload['transaction_status'],
            'gateway_response' => $payload,
        ]);

        $order = $payment->order;

        match ($payload['transaction_status']) {
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
