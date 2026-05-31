<?php

namespace Modules\Admin\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Catalog\Models\Product;
use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderLine;
use Modules\Ordering\Models\OrderStatusHistory;
use Modules\Ordering\Services\ShippingService;
use Yajra\DataTables\Facades\DataTables;

class OrderController extends Controller
{
    public function __construct(
        private CurrencyService $currency,
        private ShippingService $shipping,
    ) {}

    public function index(Request $request)
    {
        return Inertia::render('admin/orders/index');
    }

    public function datatable(): JsonResponse
    {
        $query = Order::with('user', 'payment')->select('orders.*');

        return DataTables::of($query)
            ->addColumn('customer_name', fn ($o) => $o->user?->name ?? '—')
            ->addColumn('total', fn ($o) => 'Rp ' . number_format($o->grand_total_idr, 0, ',', '.'))
            ->addColumn('payment_status', fn ($o) => $o->payment?->status ?? 'unpaid')
            ->make(true);
    }

    public function show(Order $order)
    {
        $order->load(['user', 'lines.variant.media', 'lines.product.media', 'payment', 'statusHistories.changer']);

        $order->lines->each(function ($line) {
            $variant = $line->variant;
            $product = $line->product;

            if ($variant && $variant->hasMedia('image')) {
                $line->image_url = $variant->getFirstMediaUrl('image');
            } elseif ($product) {
                $line->image_url = $product->thumbnail
                    ?? ($product->getFirstMediaUrl('images', 'thumb') ?: $product->getFirstMediaUrl('images') ?: null);
            } else {
                $line->image_url = null;
            }
        });

        return Inertia::render('admin/orders/show', [
            'order' => $order,
        ]);
    }

    private const TRANSITIONS = [
        'pending'    => ['cancelled'],
        'confirmed'  => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
    ];

    public function transition(Request $request, Order $order)
    {
        $allowed = self::TRANSITIONS[$order->status] ?? [];

        $request->validate([
            'status'          => 'required|in:' . implode(',', $allowed),
            'courier'         => 'required_if:status,shipped|nullable|string|max:100',
            'tracking_number' => 'required_if:status,shipped|nullable|string|max:100',
        ]);

        $fields = ['status' => $request->status];
        if ($request->status === 'shipped') {
            $fields['courier']         = $request->courier;
            $fields['tracking_number'] = $request->tracking_number;
        }
        $order->update($fields);

        OrderStatusHistory::create([
            'order_id'   => $order->id,
            'status'     => $request->status,
            'changed_by' => auth()->id(),
        ]);

        return back()->with('success', 'Order status updated.');
    }

    public function create()
    {
        $customers = User::role('customer')->select('id', 'name', 'email')->orderBy('name')->get();
        $products = Product::with(['translations', 'variants'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($product) {
                $nameEn = $product->translations->firstWhere('locale', 'en')?->name ?? $product->slug;
                return [
                    'id'                     => $product->id,
                    'slug'                   => $product->slug,
                    'name'                   => $nameEn,
                    'price'                  => $product->price,
                    'price_idr'              => $this->currency->rmbToIdr($product->price),
                    'delivery_charge_batam'  => $product->delivery_charge_batam,
                    'delivery_charge_jakarta' => $product->delivery_charge_jakarta,
                    'delivery_charge'        => $product->delivery_charge,
                    'variants'               => $product->variants->map(fn ($v) => [
                        'id'      => $v->id,
                        'sku'     => $v->sku,
                        'price'   => $v->price,
                        'price_idr' => $this->currency->rmbToIdr($product->price + $v->price),
                    ]),
                ];
            });

        return Inertia::render('admin/orders/create', [
            'customers'    => $customers,
            'products'     => $products,
            'exchangeRate' => $this->currency->getActiveRate(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id'              => 'required|exists:users,id',
            'recipient_name'       => 'required|string|max:255',
            'recipient_phone'      => 'required|string|max:30',
            'street_address'       => 'required|string',
            'city'                 => 'required|string|max:100',
            'province'             => 'nullable|string|max:100',
            'postal_code'          => 'nullable|string|max:10',
            'notes'                => 'nullable|string',
            'manual_shipping_rmb'  => 'nullable|numeric|min:0',
            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'required|exists:products,id',
            'items.*.variant_id'   => 'nullable|exists:product_variants,id',
            'items.*.quantity'     => 'required|integer|min:1',
        ]);

        $city = $request->city;
        $isKnownCity = in_array(strtolower($city), ['batam', 'jakarta']);

        $exchangeRate = $this->currency->getActiveRate();

        $order = DB::transaction(function () use ($request, $city, $isKnownCity, $exchangeRate) {
            $subtotalRmb = 0;
            $lines = [];

            foreach ($request->items as $itemData) {
                $product = Product::with('translations')->find($itemData['product_id']);
                $variant = $itemData['variant_id']
                    ? $product->variants()->find($itemData['variant_id'])
                    : null;

                $priceRmb = ($product->price ?? 0) + ($variant?->price ?? 0);
                $unitPriceIdr = $this->currency->rmbToIdr($priceRmb);
                $qty = (int) $itemData['quantity'];
                $subtotalRmb += $priceRmb * $qty;

                $nameEn = $product->translations->firstWhere('locale', 'en')?->name ?? $product->slug;

                $lines[] = [
                    'product_id'         => $product->id,
                    'product_variant_id' => $variant?->id,
                    'product_name'       => $nameEn,
                    'variant_name'       => $variant?->sku,
                    'sku'                => $variant?->sku ?? $product->slug ?? '-',
                    'unit_price_idr'     => $unitPriceIdr,
                    'quantity'           => $qty,
                    'subtotal_idr'       => $unitPriceIdr * $qty,
                ];
            }

            $subtotalIdr = $this->currency->rmbToIdr($subtotalRmb);

            if ($isKnownCity && empty($request->manual_shipping_rmb)) {
                // Auto-compute shipping based on known city tier
                // Build a temporary collection to sum delivery charges
                $productIds = collect($request->items)->pluck('product_id')->unique();
                $shippingRmb = Product::whereIn('id', $productIds)->get()->sum(function ($product) use ($city) {
                    return match (strtolower($city)) {
                        'jakarta' => $product->delivery_charge_jakarta ?: $product->delivery_charge,
                        default   => $product->delivery_charge_batam ?: $product->delivery_charge,
                    };
                });
                $shippingIdr = $this->currency->rmbToIdr($shippingRmb);
            } else {
                $shippingIdr = $this->currency->rmbToIdr((float) ($request->manual_shipping_rmb ?? 0));
            }

            $order = Order::create([
                'user_id'                => $request->user_id,
                'status'                 => 'pending',
                'subtotal_idr'           => $subtotalIdr,
                'shipping_idr'           => $shippingIdr,
                'grand_total_idr'        => $subtotalIdr + $shippingIdr,
                'exchange_rate_snapshot' => $exchangeRate,
                'recipient_name'         => $request->recipient_name,
                'recipient_phone'        => $request->recipient_phone,
                'street_address'         => $request->street_address,
                'city'                   => $city,
                'province'               => $request->province,
                'postal_code'            => $request->postal_code,
                'notes'                  => $request->notes,
            ]);

            foreach ($lines as $line) {
                OrderLine::create(['order_id' => $order->id, ...$line]);
            }

            OrderStatusHistory::create([
                'order_id'   => $order->id,
                'status'     => 'pending',
                'changed_by' => auth()->id(),
            ]);

            return $order;
        });

        return redirect()->route('admin.orders.show', $order)
            ->with('success', 'Order created successfully.');
    }
}
