<?php

namespace Modules\Accounting\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Accounting\Services\AccountingService;

class ReportController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    public function trialBalance(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');

        return Inertia::render('admin/accounting/reports/trial-balance', [
            'rows'    => $this->accounting->trialBalance($startDate, $endDate),
            'filters' => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }

    public function balanceSheet(Request $request)
    {
        $asOfDate = $request->query('as_of_date', now()->toDateString());

        return Inertia::render('admin/accounting/reports/balance-sheet', [
            'report'  => $this->accounting->balanceSheet($asOfDate),
            'filters' => ['as_of_date' => $asOfDate],
        ]);
    }

    public function incomeStatement(Request $request)
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate   = $request->query('end_date', now()->toDateString());

        return Inertia::render('admin/accounting/reports/income-statement', [
            'report'  => $this->accounting->incomeStatement($startDate, $endDate),
            'filters' => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }
}
