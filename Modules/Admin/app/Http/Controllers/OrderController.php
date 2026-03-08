<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Ordering\Models\Order;
use Yajra\DataTables\Facades\DataTables;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('admin/orders/index');
    }

    public function datatable(): JsonResponse
    {
        $query = Order::with('user')->select('orders.*');

        return DataTables::of($query)
            ->addColumn('customer_name', fn ($o) => $o->user?->name ?? '—')
            ->addColumn('total', fn ($o) => 'Rp ' . number_format($o->grand_total_idr, 0, ',', '.'))
            ->make(true);
    }

    public function show(Order $order)
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load('user', 'lines', 'payment'),
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $allowed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        $request->validate(['status' => 'required|in:' . implode(',', $allowed)]);
        $order->update(['status' => $request->status]);

        return back();
    }
}
