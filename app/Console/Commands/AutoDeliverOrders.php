<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderStatusHistory;

class AutoDeliverOrders extends Command
{
    protected $signature = 'orders:auto-deliver';

    protected $description = 'Mark shipped orders as delivered when no customer confirmation after 7 days';

    public function handle(): void
    {
        // Find order IDs that have been in 'shipped' status for more than 7 days
        $orderIds = OrderStatusHistory::where('status', 'shipped')
            ->where('created_at', '<=', now()->subDays(7))
            ->pluck('order_id');

        if ($orderIds->isEmpty()) {
            $this->info('No orders to auto-deliver.');

            return;
        }

        $orders = Order::whereIn('id', $orderIds)
            ->where('status', 'shipped')
            ->get();

        $count = 0;
        foreach ($orders as $order) {
            $order->update(['status' => 'delivered']);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'delivered',
                'changed_by' => null,
            ]);

            $count++;
        }

        $this->info("Auto-delivered {$count} order(s).");
    }
}
