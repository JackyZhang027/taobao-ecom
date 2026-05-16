<?php

namespace Modules\Ordering\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderStatusHistory;
use Modules\Payment\Services\PaymentService;

class OrderController extends Controller
{
    public function __construct(private PaymentService $payment) {}

    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return Inertia::render('orders/index', ['orders' => $orders]);
    }

    public function show(Request $request, Order $order)
    {
        abort_if($order->user_id !== $request->user()->id, 403);

        return Inertia::render('orders/show', [
            'order' => $order->load('lines', 'payment', 'statusHistories'),
            'isProduction' => config('midtrans.is_production', false),
            'clientKey' => config('midtrans.client_key'),
        ]);
    }

    public function confirmReceipt(Request $request, Order $order)
    {
        abort_if($order->user_id !== $request->user()->id, 403);
        abort_if($order->status !== 'shipped', 422);

        $order->update(['status' => 'delivered']);

        OrderStatusHistory::create([
            'order_id'   => $order->id,
            'status'     => 'delivered',
            'changed_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Receipt confirmed. Thank you!');
    }

    public function confirmPayment(Request $request, Order $order)
    {
        abort_if($order->user_id !== $request->user()->id, 403);

        $transactionStatus = $this->payment->confirmFromTransaction($order);

        return response()->json([
            'status' => $order->fresh()->status,
            'transaction_status' => $transactionStatus,
        ]);
    }
}
