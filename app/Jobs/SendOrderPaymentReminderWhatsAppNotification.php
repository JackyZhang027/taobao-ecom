<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
use App\Support\MessageTemplate;
use App\Support\PhoneNumber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\Admin\Models\ShopSetting;
use Modules\Ordering\Models\Order;

class SendOrderPaymentReminderWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    private const DEFAULT_TEMPLATE = "⏰ Payment Reminder\n"
        ."Hi {customer_name}, your order #{order_no} (Rp {total}) is still unpaid.\n"
        ."Please complete your payment here:\n{link}\n\n"
        ."If you've already paid, please ignore this message.";

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
        $template = ShopSetting::get('whatsapp_payment_reminder_template') ?: self::DEFAULT_TEMPLATE;

        return MessageTemplate::render($template, [
            'order_no' => $order->order_number,
            'date' => $order->created_at?->format('d M Y H:i'),
            'customer_name' => $order->recipient_name,
            'customer_phone' => $order->recipient_phone,
            'total' => number_format((float) $order->grand_total_idr, 0, ',', '.'),
            'link' => route('orders.show', $order),
            'shop_name' => ShopSetting::get('shop_name'),
        ]);
    }
}
