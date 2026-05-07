<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Ordering\Models\Order;
use App\Models\User;

class DashboardController extends Controller
{
    // Ordered list of permission → redirect URL.
    // When a user can access the panel but lacks dashboard.view,
    // they are sent to the first URL in this list they have permission for.
    private const FALLBACK_ROUTES = [
        'products.view'                  => '/admin/products',
        'categories.view'                => '/admin/categories',
        'attributes.view'                => '/admin/attribute-types',
        'orders.view'                    => '/admin/orders',
        'customers.view'                 => '/admin/customers',
        'wishlists.view'                 => '/admin/wishlists',
        'accounting_accounts.view'       => '/admin/accounting/accounts',
        'accounting_journals.view'       => '/admin/accounting/journals',
        'accounting_ledger.view'         => '/admin/accounting/ledger',
        'accounting_trial_balance.view'  => '/admin/accounting/reports/trial-balance',
        'accounting_balance_sheet.view'  => '/admin/accounting/reports/balance-sheet',
        'accounting_income_statement.view' => '/admin/accounting/reports/income-statement',
        'users.view'                     => '/admin/users',
        'roles.view'                     => '/admin/roles',
        'settings.view'                  => '/admin/settings/shop',
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

        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $revenue = Order::where('status', 'confirmed')->sum('grand_total_idr');
        $newCustomers = User::where('created_at', '>=', now()->subDays(30))->count();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'orders_by_status' => $ordersByStatus,
                'total_revenue'    => $revenue,
                'new_customers'    => $newCustomers,
            ],
        ]);
    }
}
