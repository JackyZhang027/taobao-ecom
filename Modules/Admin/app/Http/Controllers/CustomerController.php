<?php

namespace Modules\Admin\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Yajra\DataTables\Facades\DataTables;

class CustomerController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/customers/index');
    }

    public function datatable(): JsonResponse
    {
        $query = User::role('customer')->withCount('orders')->select('users.*');

        return DataTables::of($query)
            ->addColumn('orders_count', fn ($user) => $user->orders_count)
            ->addColumn('actions', fn ($user) => $user->id)
            ->make(true);
    }
}
