<?php

namespace Modules\Ordering\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Admin\Models\ShopSetting;
use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\CartItem;
use Modules\Payment\Models\Payment;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderLine;
use Modules\Ordering\Models\OrderStatusHistory;
use Modules\Ordering\Services\CartService;
use Modules\Ordering\Services\ShippingService;
use Modules\Payment\Services\PaymentService;

class CheckoutController extends Controller
{
    public function __construct(
        private CartService $cartService,
        private CurrencyService $currency,
        private ShippingService $shipping,
        private PaymentService $payment,
    ) {}

    public function index(Request $request)
    {
        $cart = $this->cartService->resolveCart($request);
        $cart->load(
            'items.variant.product.translations',
            'items.variant.product.media',
            'items.product.translations',
            'items.product.media',
        );
        $city = $request->get('city', 'Batam');
        $totals = $this->cartService->computeTotals($cart, $this->currency, $this->shipping, $city);

        $locale = app()->getLocale();
        $cartData = [
            'id' => $cart->id,
            'user_id' => $cart->user_id,
            'items' => $cart->items->map(function ($item) use ($locale) {
                $variant = $item->variant;
                $product = $variant?->product ?? $item->product;
                $translation = $product?->translations->firstWhere('locale', $locale)
                    ?? $product?->translations->firstWhere('locale', 'en');
                $thumbnail = $product?->thumbnail
                    ?? ($product?->getFirstMediaUrl('images', 'thumb') ?: $product?->getFirstMediaUrl('images') ?: null);
                $priceRmb = ($product?->price ?? 0) + ($variant?->price ?? 0);

                return [
                    'id' => $item->id,
                    'cart_id' => $item->cart_id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
                    'variant' => $variant ? [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'price_idr' => $this->currency->rmbToIdr($priceRmb),
                        'product' => $product ? [
                            'id' => $product->id,
                            'slug' => $product->slug,
                            'thumbnail' => $thumbnail,
                            'name' => $translation?->name ?? $product->slug,
                        ] : null,
                    ] : ($product ? [
                        'id' => null,
                        'sku' => null,
                        'price_idr' => $this->currency->rmbToIdr($priceRmb),
                        'product' => [
                            'id' => $product->id,
                            'slug' => $product->slug,
                            'thumbnail' => $thumbnail,
                            'name' => $translation?->name ?? $product->slug,
                        ],
                    ] : null),
                ];
            }),
        ];

        return Inertia::render('checkout/index', [
            'cart' => $cartData,
            'totals' => $totals,
            'whatsapp_number' => ShopSetting::get('whatsapp_number', ''),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:30',
            'street_address' => 'required|string',
            'city' => 'required|string|in:Batam,Jakarta',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'notes' => 'nullable|string|max:1000',
        ]);

        $cart = $this->cartService->resolveCart($request);
        $cart->load('items.variant.product.translations', 'items.product.translations');

        $city = $request->city;
        $totals = $this->cartService->computeTotals($cart, $this->currency, $this->shipping, $city);

        $canDeliver = strtolower($city) === 'jakarta'
            ? $totals['can_deliver_jakarta']
            : $totals['can_deliver_batam'];

        if (! $canDeliver) {
            return back()->withErrors(['city' => 'Delivery is not available for the selected city.']);
        }

        $exchangeRate = $this->currency->getActiveRate();

        $order = DB::transaction(function () use ($request, $cart, $totals, $exchangeRate, $city) {
            $order = Order::create([
                'user_id' => $request->user()->id,
                'status' => 'pending',
                'subtotal_idr' => $totals['subtotal_idr'],
                'shipping_idr' => $totals['shipping_idr'],
                'grand_total_idr' => $totals['grand_total_idr'],
                'exchange_rate_snapshot' => $exchangeRate,
                'recipient_name' => $request->recipient_name,
                'recipient_phone' => $request->recipient_phone,
                'street_address' => $request->street_address,
                'city' => $city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
                'notes' => $request->notes,
            ]);

            $locale = app()->getLocale();
            foreach ($cart->items as $item) {
                $variant = $item->variant;
                $product = $variant?->product ?? $item->product;
                $translation = $product?->translations->firstWhere('locale', $locale)
                    ?? $product?->translations->firstWhere('locale', 'en');
                $priceRmb = ($product?->price ?? 0) + ($variant?->price ?? 0);
                $unitPriceIdr = $this->currency->rmbToIdr($priceRmb);

                OrderLine::create([
                    'order_id' => $order->id,
                    'product_id' => $product?->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $translation?->name ?? $product?->slug,
                    'variant_name' => $variant?->sku,
                    'sku' => $variant?->sku ?? $product?->slug ?? '-',
                    'unit_price_idr' => $unitPriceIdr,
                    'quantity' => $item->quantity,
                    'subtotal_idr' => $unitPriceIdr * $item->quantity,
                ]);
            }

            CartItem::where('cart_id', $cart->id)->delete();

            OrderStatusHistory::create([
                'order_id'   => $order->id,
                'status'     => 'pending',
                'changed_by' => $request->user()->id,
            ]);

            return $order;
        });

        $order->load('lines');
        $snapToken = $this->payment->createSnapToken($order);

        return redirect()->route('checkout.complete', $order);
    }

    public function complete(Request $request, Order $order)
    {
        abort_if($order->user_id !== $request->user()->id, 403);

        $order->load(['lines', 'payment']);

        return Inertia::render('checkout/complete', [
            'order' => $order,
            'snapToken' => $order->payment?->snap_token,
            'clientKey' => config('midtrans.client_key'),
            'isProduction' => config('midtrans.is_production', false),
        ]);
    }

    public function finish(Request $request)
    {
        $midtransOrderId = $request->query('order_id');

        if (! $midtransOrderId) {
            return redirect()->route('orders.index');
        }

        $payment = Payment::where('midtrans_order_id', $midtransOrderId)->first();

        if (! $payment) {
            return redirect()->route('orders.index');
        }

        $order = $payment->order;

        abort_if($order->user_id !== $request->user()->id, 403);

        $this->payment->confirmFromTransaction($order);

        return redirect()->route('orders.show', $order);
    }
}
