<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Delivery\Models\DeliveryRate;
use Modules\Delivery\Services\DeliveryService;
use Yajra\DataTables\Facades\DataTables;

class DeliveryRateController extends Controller
{
    public function __construct(private DeliveryService $delivery) {}

    public function index()
    {
        return Inertia::render('admin/delivery-rates/index');
    }

    public function datatable(): JsonResponse
    {
        $query = DeliveryRate::with('creator')->select('delivery_rates.*')->orderBy('created_at', 'desc');

        return DataTables::of($query)
            ->addColumn('creator_name', fn ($r) => $r->creator?->name ?? '—')
            ->addColumn('active_label', fn ($r) => $r->is_active ? 'Active' : '—')
            ->make(true);
    }

    public function store(Request $request)
    {
        $request->validate([
            'rate' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);
        $this->delivery->setRate((float) $request->rate, $request->user()->id, $request->notes);

        Cache::forever('cache_ver_products', microtime(true));

        return back();
    }
}
