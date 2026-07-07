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
use Modules\Delivery\Services\DeliveryService;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderLine;
use Modules\Ordering\Models\OrderStatusHistory;
use Modules\Ordering\Services\ShippingService;
use Modules\Payment\Services\PaymentService;
use Yajra\DataTables\Facades\DataTables;

class OrderController extends Controller
{
    public function __construct(
        private CurrencyService $currency,
        private ShippingService $shipping,
        private PaymentService $paymentService,
        private DeliveryService $delivery,
    ) {}

    public function index(Request $request)
    {
        return Inertia::render('admin/orders/index');
    }

    public function datatable(Request $request): JsonResponse
    {
        $query = Order::with('user', 'payment')->select('orders.*')
            ->when($request->filled('status') && $request->status !== 'all', fn ($q) => $q->where('status', $request->status))
            ->when($request->payment_status === 'paid', fn ($q) => $q->whereHas('payment', fn ($p) => $p->whereIn('status', ['settlement', 'capture'])))
            ->when($request->payment_status === 'unpaid', fn ($q) => $q->whereDoesntHave('payment', fn ($p) => $p->whereIn('status', ['settlement', 'capture'])))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = addcslashes($request->search, '%_\\');
                $q->where(function ($q) use ($term) {
                    $q->where('order_number', 'like', "%{$term}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"));
                });
            });

        return DataTables::of($query)
            ->addColumn('customer_name', fn ($o) => $o->user?->name ?? '—')
            ->addColumn('total', fn ($o) => 'Rp '.number_format($o->grand_total_idr, 0, ',', '.'))
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
        'pending' => ['cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
    ];

    public function transition(Request $request, Order $order)
    {
        $allowed = self::TRANSITIONS[$order->status] ?? [];

        $request->validate([
            'status' => 'required|in:'.implode(',', $allowed),
            'courier' => 'required_if:status,shipped|nullable|string|max:100',
            'tracking_number' => 'required_if:status,shipped|nullable|string|max:100',
        ]);

        // Attempt Midtrans cancellation BEFORE acquiring the DB lock so we never
        // hold a row lock while waiting on an external HTTP call. Graceful — failure
        // never blocks the local status change.
        if ($request->status === 'cancelled') {
            $this->paymentService->cancelTransaction($order);
        }

        DB::transaction(function () use ($request, $order) {
            // Re-fetch with exclusive lock to prevent concurrent state changes.
            $freshOrder = Order::lockForUpdate()->find($order->id);

            // Idempotent: if a concurrent process already moved this order to a
            // terminal state, skip quietly rather than raising an error.
            if (in_array($freshOrder->status, ['cancelled', 'delivered'], true)) {
                return;
            }

            // Re-validate: the order's status may have changed since the request arrived.
            $allowed = self::TRANSITIONS[$freshOrder->status] ?? [];
            if (! in_array($request->status, $allowed, true)) {
                abort(409, 'Order status changed concurrently. Please refresh and try again.');
            }

            $fields = ['status' => $request->status];
            if ($request->status === 'shipped') {
                $fields['courier'] = $request->courier;
                $fields['tracking_number'] = $request->tracking_number;
            }
            $freshOrder->update($fields);

            OrderStatusHistory::create([
                'order_id' => $freshOrder->id,
                'status' => $request->status,
                'changed_by' => auth()->id(),
            ]);
        });

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
                    'id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $nameEn,
                    'price' => $product->price,
                    'price_idr' => $this->currency->rmbToIdr($product->price),
                    'delivery_rate_batam' => $product->delivery_rate_batam,
                    'delivery_rate_jakarta' => $product->delivery_rate_jakarta,
                    'variants' => $product->variants->map(fn ($v) => [
                        'id' => $v->id,
                        'sku' => $v->sku,
                        'price' => $v->price,
                        'price_idr' => $this->currency->rmbToIdr($v->price),
                        'delivery_rate_batam' => $v->delivery_rate_batam,
                        'delivery_rate_jakarta' => $v->delivery_rate_jakarta,
                    ]),
                ];
            });

        return Inertia::render('admin/orders/create', [
            'customers' => $customers,
            'products' => $products,
            'exchangeRate' => $this->currency->getActiveRate(),
            'deliveryRate' => $this->delivery->getActiveRate(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:30',
            'street_address' => 'required|string',
            'city' => 'required|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
            'manual_shipping_rmb' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => ['required', \Illuminate\Validation\Rule::exists('products', 'id')->whereNull('deleted_at')],
            'items.*.variant_id' => ['nullable', \Illuminate\Validation\Rule::exists('product_variants', 'id')->whereNull('deleted_at')],
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $city = $request->city;
        $isKnownCity = in_array(strtolower($city), ['batam', 'jakarta']);

        $exchangeRate = $this->currency->getActiveRate();

        $order = DB::transaction(function () use ($request, $city, $isKnownCity, $exchangeRate) {
            $subtotalIdr = 0.0;
            $shippingIdr = 0.0;
            $lines = [];

            foreach ($request->items as $index => $itemData) {
                $product = Product::with('translations')->find($itemData['product_id']);
                $variant = $itemData['variant_id']
                    ? $product->variants()->find($itemData['variant_id'])
                    : null;

                // A variant id from another product, or a missing variant on a
                // variant product, would silently fall back to the base price
                // (0 for variant products) — reject instead.
                if ($itemData['variant_id'] && ! $variant) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.{$index}.variant_id" => 'The selected variant does not belong to the selected product.',
                    ]);
                }
                if (! $variant && $product->variants()->exists()) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.{$index}.variant_id" => 'This product requires selecting a variant.',
                    ]);
                }

                // Variant prices are absolute, not add-ons — same rule as the storefront
                // (CartService/CheckoutController/ProductTransformer).
                $priceRmb = $variant ? (float) $variant->price : (float) ($product->price ?? 0);

                // Same guard as the storefront: a zero-price line would create an
                // order Midtrans rejects when the customer tries to pay.
                if ($priceRmb <= 0) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.{$index}.product_id" => 'This product has no valid price and cannot be ordered.',
                    ]);
                }

                $unitPriceIdr = $this->currency->rmbToIdr($priceRmb);
                $qty = (int) $itemData['quantity'];
                // Sum the rounded line subtotals so grand_total_idr always equals
                // the sum of order lines (Midtrans requires an exact match).
                $subtotalIdr += $unitPriceIdr * $qty;

                $nameEn = $product->translations->firstWhere('locale', 'en')?->name ?? $product->slug;

                $lines[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $nameEn,
                    'variant_name' => $variant?->sku,
                    'sku' => $variant?->sku ?? $product->slug ?? '-',
                    'unit_price_idr' => $unitPriceIdr,
                    'quantity' => $qty,
                    'subtotal_idr' => $unitPriceIdr * $qty,
                ];

                if ($isKnownCity && empty($request->manual_shipping_rmb)) {
                    $multiplier = $this->shipping->resolveMultiplier($product, $variant, $city);
                    $shippingIdr += $this->delivery->calculateCharge((float) $multiplier) * $qty;
                }
            }

            if (! $isKnownCity || ! empty($request->manual_shipping_rmb)) {
                $shippingIdr = $this->currency->rmbToIdr((float) ($request->manual_shipping_rmb ?? 0));
            }

            $order = Order::create([
                'user_id' => $request->user_id,
                'status' => 'pending',
                'subtotal_idr' => $subtotalIdr,
                'shipping_idr' => $shippingIdr,
                'grand_total_idr' => $subtotalIdr + $shippingIdr,
                'exchange_rate_snapshot' => $exchangeRate,
                'recipient_name' => $request->recipient_name,
                'recipient_phone' => $request->recipient_phone,
                'street_address' => $request->street_address,
                'city' => $city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
                'notes' => $request->notes,
            ]);

            foreach ($lines as $line) {
                OrderLine::create(['order_id' => $order->id, ...$line]);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'pending',
                'changed_by' => auth()->id(),
            ]);

            return $order;
        });

        return redirect()->route('admin.orders.show', $order)
            ->with('success', 'Order created successfully.');
    }
}
