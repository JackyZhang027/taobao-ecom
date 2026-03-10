<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Currency\Models\ExchangeRate;
use Modules\Currency\Services\CurrencyService;
use Yajra\DataTables\Facades\DataTables;

class ExchangeRateController extends Controller
{
    public function __construct(private CurrencyService $currency) {}

    public function index()
    {
        return Inertia::render('admin/exchange-rates/index');
    }

    public function datatable(): JsonResponse
    {
        $query = ExchangeRate::with('creator')->select('exchange_rates.*')->orderBy('created_at', 'desc');

        return DataTables::of($query)
            ->addColumn('creator_name', fn ($r) => $r->creator?->name ?? '—')
            ->addColumn('active_label', fn ($r) => $r->is_active ? 'Active' : '—')
            ->make(true);
    }

    public function store(Request $request)
    {
        $request->validate(['rate' => 'required|numeric|min:0.01']);
        $this->currency->setRate((float) $request->rate, $request->user()->id, $request->notes);

        Cache::forever('cache_ver_products', microtime(true));

        return back();
    }
}
