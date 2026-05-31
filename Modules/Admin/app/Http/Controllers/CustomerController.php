<?php

namespace Modules\Admin\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rules\Password;
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

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->hasRole('customer'), 403);

        $request->validate([
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'must_change_password' => ['boolean'],
        ]);

        $user->update([
            'password' => $request->password,
            'must_change_password' => $request->boolean('must_change_password'),
        ]);

        return back()->with('success', 'Password reset successfully.');
    }
}
