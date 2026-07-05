<?php

namespace Modules\Accounting\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Services\AccountingService;

class LedgerController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    public function index(Request $request)
    {
        $accounts = Account::where('is_active', true)->orderBy('code')->get(['id', 'code', 'name', 'type', 'normal_balance']);
        $accountId = $request->query('account_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $ledger = null;

        if ($accountId) {
            $account = Account::findOrFail($accountId);
            $ledger = $this->accounting->ledger($account, $startDate, $endDate);
        }

        return Inertia::render('admin/accounting/ledger/index', [
            'accounts' => $accounts,
            'ledger' => $ledger,
            'filters' => [
                'account_id' => $accountId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
