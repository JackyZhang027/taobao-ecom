<?php

namespace Modules\Admin\Http\Controllers;

use App\Models\User;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Catalog\Models\Product;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderLine;

class DashboardController extends Controller
{
    // Statuses that count toward revenue (order has been paid/confirmed).
    private const PAID_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];

    // Ordered list of permission → redirect URL.
    // When a user can access the panel but lacks dashboard.view,
    // they are sent to the first URL in this list they have permission for.
    private const FALLBACK_ROUTES = [
        'products.view' => '/admin/products',
        'categories.view' => '/admin/categories',
        'attributes.view' => '/admin/attribute-types',
        'orders.view' => '/admin/orders',
        'customers.view' => '/admin/customers',
        'wishlists.view' => '/admin/wishlists',
        'accounting_accounts.view' => '/admin/accounting/accounts',
        'accounting_journals.view' => '/admin/accounting/journals',
        'accounting_ledger.view' => '/admin/accounting/ledger',
        'accounting_trial_balance.view' => '/admin/accounting/reports/trial-balance',
        'accounting_balance_sheet.view' => '/admin/accounting/reports/balance-sheet',
        'accounting_income_statement.view' => '/admin/accounting/reports/income-statement',
        'users.view' => '/admin/users',
        'roles.view' => '/admin/roles',
        'settings.view' => '/admin/settings/shop',
    ];

    public function index()
    {
        $user = Auth::user();

        if (! $user->can('dashboard.view')) {
            foreach (self::FALLBACK_ROUTES as $permission => $url) {
                if ($user->can($permission)) {
                    return redirect($url);
                }
            }
        }

        $periodStart = now()->subDays(30)->startOfDay();
        $previousStart = now()->subDays(60)->startOfDay();

        return Inertia::render('admin/dashboard', [
            'stats' => $this->periodStats($periodStart, $previousStart),
            'orders_by_status' => Order::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'revenue_trend' => $this->revenueTrend($periodStart),
            'recent_orders' => $this->recentOrders(),
            'top_products' => $this->topProducts($periodStart),
        ]);
    }

    private function periodStats($periodStart, $previousStart): array
    {
        $revenue = fn ($from, $to) => (float) Order::whereIn('status', self::PAID_STATUSES)
            ->where('created_at', '>=', $from)
            ->where('created_at', '<', $to)
            ->sum('grand_total_idr');

        $paidCount = fn ($from, $to) => Order::whereIn('status', self::PAID_STATUSES)
            ->where('created_at', '>=', $from)
            ->where('created_at', '<', $to)
            ->count();

        $orderCount = fn ($from, $to) => Order::where('created_at', '>=', $from)
            ->where('created_at', '<', $to)
            ->count();

        $customerCount = fn ($from, $to) => User::role('customer')
            ->where('created_at', '>=', $from)
            ->where('created_at', '<', $to)
            ->count();

        $end = now()->addDay();

        $currentRevenue = $revenue($periodStart, $end);
        $previousRevenue = $revenue($previousStart, $periodStart);
        $currentPaid = $paidCount($periodStart, $end);
        $previousPaid = $paidCount($previousStart, $periodStart);

        return [
            'revenue' => ['current' => $currentRevenue, 'previous' => $previousRevenue],
            'orders' => ['current' => $orderCount($periodStart, $end), 'previous' => $orderCount($previousStart, $periodStart)],
            'customers' => ['current' => $customerCount($periodStart, $end), 'previous' => $customerCount($previousStart, $periodStart)],
            'aov' => [
                'current' => $currentPaid > 0 ? $currentRevenue / $currentPaid : 0,
                'previous' => $previousPaid > 0 ? $previousRevenue / $previousPaid : 0,
            ],
            'pending_orders' => Order::where('status', 'pending')->count(),
        ];
    }

    /**
     * Daily revenue (paid orders), order counts and customer sign-ups for the
     * last 30 days, grouped in PHP so it works on both MySQL and SQLite.
     */
    private function revenueTrend($periodStart): array
    {
        $orders = Order::where('created_at', '>=', $periodStart)
            ->get(['created_at', 'grand_total_idr', 'status'])
            ->groupBy(fn (Order $order) => $order->created_at->format('Y-m-d'));

        $customers = User::role('customer')
            ->where('created_at', '>=', $periodStart)
            ->get(['users.id', 'users.created_at'])
            ->groupBy(fn (User $user) => $user->created_at->format('Y-m-d'));

        $trend = [];
        $end = now();
        for ($date = $periodStart; $date <= $end; $date = $date->addDay()) {
            $key = $date->format('Y-m-d');
            $daily = $orders->get($key, collect());
            $paid = $daily->whereIn('status', self::PAID_STATUSES);

            $trend[] = [
                'date' => $key,
                'revenue' => (float) $paid->sum('grand_total_idr'),
                'orders' => $daily->count(),
                'paid_orders' => $paid->count(),
                'customers' => $customers->get($key)?->count() ?? 0,
            ];
        }

        return $trend;
    }

    private function recentOrders(): array
    {
        return Order::with('user:id,name')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer' => $order->user?->name ?? $order->recipient_name,
                'status' => $order->status,
                'grand_total_idr' => $order->grand_total_idr,
                'created_at' => $order->created_at->toISOString(),
            ])
            ->all();
    }

    private function topProducts($periodStart): array
    {
        // Group by product_id, not product_name: the name is a locale-dependent
        // snapshot, so the same product bought under different locales would
        // otherwise split into separate rows.
        $lines = OrderLine::query()
            ->join('orders', 'orders.id', '=', 'order_lines.order_id')
            ->whereIn('orders.status', self::PAID_STATUSES)
            ->where('orders.created_at', '>=', $periodStart)
            ->groupBy('order_lines.product_id')
            ->orderByDesc(DB::raw('SUM(order_lines.quantity)'))
            ->limit(5)
            ->get([
                'order_lines.product_id',
                DB::raw('MAX(order_lines.product_name) as snapshot_name'),
                DB::raw('SUM(order_lines.quantity) as units'),
                DB::raw('SUM(order_lines.subtotal_idr) as revenue'),
            ]);

        $products = Product::withTrashed()
            ->with('translations')
            ->whereIn('id', $lines->pluck('product_id')->filter())
            ->get()
            ->keyBy('id');

        return $lines
            ->map(fn ($line) => [
                'product_id' => $line->product_id,
                'product_name' => $products->get($line->product_id)?->name ?? $line->snapshot_name,
                'units' => (int) $line->units,
                'revenue' => (float) $line->revenue,
            ])
            ->all();
    }
}
