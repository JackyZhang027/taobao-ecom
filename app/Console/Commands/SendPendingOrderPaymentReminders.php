<?php

namespace App\Console\Commands;

use App\Jobs\SendOrderPaymentReminderWhatsAppNotification;
use App\Support\ReminderSchedule;
use Illuminate\Console\Command;
use Modules\Admin\Models\ShopSetting;
use Modules\Ordering\Models\Order;

class SendPendingOrderPaymentReminders extends Command
{
    protected $signature = 'orders:send-payment-reminders';

    protected $description = 'Send WhatsApp payment reminders to customers with unpaid pending orders';

    public function handle(): void
    {
        if (! filter_var(ShopSetting::get('whatsapp_customer_reminder_enabled', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->info('Customer payment reminders are disabled.');

            return;
        }

        $thresholds = ReminderSchedule::parseToMinutes(
            (string) ShopSetting::get('whatsapp_customer_reminder_schedule', '10m,6h,23h')
        );

        if (empty($thresholds)) {
            $this->info('No reminder thresholds configured.');

            return;
        }

        $dispatched = 0;

        Order::where('status', 'pending')
            ->where('payment_reminder_count', '<', count($thresholds))
            ->chunkById(100, function ($orders) use ($thresholds, &$dispatched) {
                foreach ($orders as $order) {
                    $thresholdMinutes = $thresholds[$order->payment_reminder_count] ?? null;

                    if ($thresholdMinutes === null) {
                        continue;
                    }

                    if ($order->created_at->diffInMinutes(now()) < $thresholdMinutes) {
                        continue;
                    }

                    $order->update([
                        'payment_reminder_count' => $order->payment_reminder_count + 1,
                        'last_payment_reminder_at' => now(),
                    ]);

                    SendOrderPaymentReminderWhatsAppNotification::dispatch($order, $thresholdMinutes);
                    $dispatched++;
                }
            });

        $this->info("Dispatched {$dispatched} payment reminder(s).");
    }
}
