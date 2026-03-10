<?php

namespace Modules\Accounting\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Accounting\Models\Account;
use Yajra\DataTables\Facades\DataTables;

class AccountController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/accounting/accounts/index');
    }

    public function datatable(): JsonResponse
    {
        $query = Account::with('parent')->select('accounts.*');

        return DataTables::of($query)
            ->addColumn('parent_name', fn ($a) => $a->parent?->name ?? '—')
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/accounting/accounts/create', [
            'accounts' => Account::where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
            'types'    => ['asset', 'liability', 'equity', 'revenue', 'expense'],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code'        => 'required|string|max:20|unique:accounts,code',
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:asset,liability,equity,revenue,expense',
            'parent_id'   => 'nullable|exists:accounts,id',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $data['normal_balance'] = Account::normalBalanceForType($data['type']);

        Account::create($data);

        return redirect()->route('admin.accounting.accounts.index')
            ->with('success', 'Account created successfully.');
    }

    public function edit(Account $account)
    {
        return Inertia::render('admin/accounting/accounts/edit', [
            'account'  => $account,
            'accounts' => Account::where('is_active', true)
                ->where('id', '!=', $account->id)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
            'types'    => ['asset', 'liability', 'equity', 'revenue', 'expense'],
        ]);
    }

    public function update(Request $request, Account $account)
    {
        $data = $request->validate([
            'code'        => 'required|string|max:20|unique:accounts,code,' . $account->id,
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:asset,liability,equity,revenue,expense',
            'parent_id'   => 'nullable|exists:accounts,id',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $data['normal_balance'] = Account::normalBalanceForType($data['type']);

        $account->update($data);

        return redirect()->route('admin.accounting.accounts.index')
            ->with('success', 'Account updated successfully.');
    }

    public function destroy(Account $account)
    {
        if ($account->journalLines()->exists()) {
            return back()->withErrors(['account' => 'Cannot delete an account that has journal lines.']);
        }

        $account->delete();

        return redirect()->route('admin.accounting.accounts.index')
            ->with('success', 'Account deleted.');
    }
}
