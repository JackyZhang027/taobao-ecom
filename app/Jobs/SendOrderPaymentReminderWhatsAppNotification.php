<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
use App\Support\PhoneNumber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\Ordering\Models\Order;

class SendOrderPaymentReminderWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public Order $order, public int $thresholdMinutes) {}

    public function handle(WhatsAppService $whatsapp): void
    {
        $order = $this->order->fresh();

        if (! $order || $order->status !== 'pending') {
            \Log::info('SendOrderPaymentReminderWhatsAppNotification: order no longer pending, skipping', [
                'order_id' => $this->order->id,
            ]);

            return;
        }

        $number = PhoneNumber::toWhatsAppFormat($order->recipient_phone);

        if (! $whatsapp->checkNumber($number)) {
            \Log::info('SendOrderPaymentReminderWhatsAppNotification: number has no WhatsApp, skipping', [
                'order_id' => $order->id,
                'number' => $number,
            ]);

            return;
        }

        $whatsapp->send($number, $this->buildMessage($order));
    }

    private function buildMessage(Order $order): string
    {
        $total = number_format((float) $order->grand_total_idr, 0, ',', '.');
        $link = route('orders.show', $order);

        return "⏰ Payment Reminder\n"
            ."Hi {$order->recipient_name}, your order #{$order->order_number} (Rp {$total}) is still unpaid.\n"
            ."Please complete your payment here:\n{$link}\n\n"
            ."If you've already paid, please ignore this message.";
    }
}
