<?php

namespace Modules\Payment\Services;

use Illuminate\Support\Facades\DB;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderStatusHistory;
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

        $midtransOrderId = 'ORDER-' . $order->id . '-' . \Illuminate\Support\Str::ulid();

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

    private const TERMINAL_STATUSES = ['cancelled', 'delivered'];

    private const CANCELLABLE_PAYMENT_STATUSES = ['pending', 'authorize'];

    private const ALLOWED_STATUSES = [
        'pending', 'settlement', 'capture', 'authorize',
        'cancel', 'expire', 'deny', 'refund', 'partial_refund',
    ];

    /**
     * Cancel the Midtrans transaction for an order. Graceful — never throws.
     * Safe to call even if no payment exists or the transaction is not cancellable.
     */
    public function cancelTransaction(Order $order): void
    {
        $payment = $order->payment;

        if (! $payment) {
            \Log::info('cancelTransaction: no payment found for order', ['order_id' => $order->id]);
            return;
        }

        if (! in_array($payment->status, self::CANCELLABLE_PAYMENT_STATUSES, true)) {
            \Log::info('cancelTransaction: payment not in cancellable state — skipping Midtrans call', [
                'order_id'       => $order->id,
                'payment_status' => $payment->status,
            ]);
            return;
        }

        try {
            $response = Transaction::cancel($payment->midtrans_order_id);
            \Log::info('cancelTransaction: Midtrans cancel successful', [
                'order_id'          => $order->id,
                'midtrans_order_id' => $payment->midtrans_order_id,
                'response'          => $response,
            ]);
        } catch (\Throwable $e) {
            // Swallowed intentionally — local cancellation must always proceed regardless.
            \Log::warning('cancelTransaction: Midtrans cancel failed (local cancel will still proceed)', [
                'order_id'          => $order->id,
                'midtrans_order_id' => $payment->midtrans_order_id,
                'error'             => $e->getMessage(),
            ]);
        }
    }

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

        $order = $payment->order;

        if (! $order) {
            return;
        }

        // Early exit before acquiring the DB lock (avoids unnecessary locking overhead).
        if (in_array($order->status, self::TERMINAL_STATUSES, true)) {
            \Log::warning('Midtrans webhook ignored: order is in terminal state', [
                'midtrans_order_id'  => $payload['order_id'],
                'order_id'           => $order->id,
                'order_status'       => $order->status,
                'transaction_status' => $transactionStatus,
            ]);
            return;
        }

        DB::transaction(function () use ($payment, $order, $transactionStatus, $payload) {
            // Re-fetch with exclusive lock to prevent concurrent state changes.
            $order = Order::lockForUpdate()->find($order->id);

            // Double-check inside the lock (double-checked locking pattern).
            if (in_array($order->status, self::TERMINAL_STATUSES, true)) {
                return;
            }

            $payment->update([
                'status' => $transactionStatus,
                'gateway_response' => $payload,
            ]);

            match ($transactionStatus) {
                'settlement', 'capture' => $this->transitionOrder($order, 'confirmed'),
                'cancel', 'expire', 'deny' => $this->transitionOrder($order, 'cancelled'),
                default => null,
            };
        });
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

        try {
            $status = Transaction::status($payment->midtrans_order_id);
        } catch (\Throwable $e) {
            \Log::error('Midtrans Transaction::status() failed', [
                'order_id' => $order->id,
                'midtrans_order_id' => $payment->midtrans_order_id,
                'error' => $e->getMessage(),
            ]);
            return 'error';
        }

        $transactionStatus = $status->transaction_status;

        return DB::transaction(function () use ($order, $payment, $transactionStatus, $status) {
            $order = Order::lockForUpdate()->find($order->id);

            if (in_array($order->status, self::TERMINAL_STATUSES, true)) {
                \Log::info('confirmFromTransaction: skipping transition — order is in terminal state', [
                    'order_id'           => $order->id,
                    'order_status'       => $order->status,
                    'transaction_status' => $transactionStatus,
                ]);
                return $transactionStatus;
            }

            $payment->update([
                'status' => $transactionStatus,
                'gateway_response' => (array) $status,
            ]);

            match ($transactionStatus) {
                'settlement', 'capture' => $this->transitionOrder($order, 'confirmed'),
                'cancel', 'expire', 'deny' => $this->transitionOrder($order, 'cancelled'),
                default => null,
            };

            return $transactionStatus;
        });
    }

    private function transitionOrder(Order $order, string $newStatus): void
    {
        // Never transition out of terminal states (last line of defence).
        if (in_array($order->status, self::TERMINAL_STATUSES, true)) {
            \Log::info('transitionOrder skipped: order is in terminal state', [
                'order_id'   => $order->id,
                'status'     => $order->status,
                'new_status' => $newStatus,
            ]);
            return;
        }

        if ($order->status === $newStatus) {
            return;
        }

        $order->update(['status' => $newStatus]);

        OrderStatusHistory::create([
            'order_id'   => $order->id,
            'status'     => $newStatus,
            'changed_by' => null,
        ]);
    }
}
