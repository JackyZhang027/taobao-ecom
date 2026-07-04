<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
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

        foreach ($numbers as $number) {
            $whatsapp->send($number, $message);
        }
    }

    private function buildMessage(): string
    {
        $total = number_format((float) $this->order->grand_total_idr, 0, ',', '.');

        return "🔔 New Paid Order\n"
            ."Order: #{$this->order->order_number}\n"
            ."Customer: {$this->order->recipient_name}\n"
            ."Phone: {$this->order->recipient_phone}\n"
            ."Total: Rp {$total}";
    }
}
