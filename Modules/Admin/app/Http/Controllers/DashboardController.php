<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Ordering\Models\Order;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $revenue = Order::where('status', 'confirmed')->sum('grand_total_idr');
        $newCustomers = User::where('created_at', '>=', now()->subDays(30))->count();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'orders_by_status' => $ordersByStatus,
                'total_revenue' => $revenue,
                'new_customers' => $newCustomers,
            ],
        ]);
    }
}
