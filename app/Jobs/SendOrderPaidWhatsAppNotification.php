<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
use App\Support\MessageTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\Admin\Models\ShopSetting;
use Modules\Ordering\Models\Order;

class SendOrderPaidWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    private const DEFAULT_TEMPLATE = "🔔 New Paid Order\n"
        ."Order: #{order_no}\n"
        ."Customer: {customer_name}\n"
        ."Phone: {customer_phone}\n"
        .'Total: Rp {total}';

    public function __construct(public Order $order) {}

    public function handle(WhatsAppService $whatsapp): void
    {
        $numbers = collect(explode(',', (string) ShopSetting::get('whatsapp_admin_numbers')))
            ->map(fn ($number) => trim($number))
            ->filter()
            ->values();

        if ($numbers->isEmpty()) {
            \Log::warning('SendOrderPaidWhatsAppNotification: no admin numbers configured, skipping', [
                'order_id' => $this->order->id,
            ]);

            return;
        }

        $message = $this->buildMessage();

        // Isolate per-number failures: retrying the whole job would re-send to
        // numbers that already succeeded. Only retry when nothing went through.
        $failures = 0;
        foreach ($numbers as $number) {
            try {
                $whatsapp->send($number, $message);
            } catch (\Throwable $e) {
                $failures++;
                \Log::warning('SendOrderPaidWhatsAppNotification: send failed for one number', [
                    'order_id' => $this->order->id,
                    'number' => $number,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($failures === $numbers->count()) {
            throw new \RuntimeException("WhatsApp order-paid notification failed for all {$failures} admin number(s).");
        }
    }

    private function buildMessage(): string
    {
        $template = ShopSetting::get('whatsapp_order_paid_template') ?: self::DEFAULT_TEMPLATE;

        return MessageTemplate::render($template, [
            'order_no' => $this->order->order_number,
            'date' => $this->order->created_at?->format('d M Y H:i'),
            'customer_name' => $this->order->recipient_name,
            'customer_phone' => $this->order->recipient_phone,
            'total' => number_format((float) $this->order->grand_total_idr, 0, ',', '.'),
            'link' => route('orders.show', $this->order),
            'shop_name' => ShopSetting::get('shop_name'),
        ]);
    }
}
