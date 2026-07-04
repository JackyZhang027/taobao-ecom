<?php

namespace Modules\Ordering\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Admin\Models\ShopSetting;
use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\CartItem;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderLine;
use Modules\Ordering\Models\OrderStatusHistory;
use Modules\Ordering\Services\CartService;
use Modules\Ordering\Services\ShippingService;
use Modules\Payment\Models\Payment;
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
                $isUnavailable = $variant && $variant->trashed();
                $product = $variant?->product ?? $item->product;
                $translation = $product?->translations->firstWhere('locale', $locale)
                    ?? $product?->translations->firstWhere('locale', 'en');
                $thumbnail = $product?->thumbnail
                    ?? ($product?->getFirstMediaUrl('images', 'thumb') ?: $product?->getFirstMediaUrl('images') ?: null);
                $priceRmb = $variant ? $variant->price : ($product?->price ?? 0);

                return [
                    'id' => $item->id,
                    'cart_id' => $item->cart_id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
                    'is_unavailable' => $isUnavailable,
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
        $cart->load('items.variant.options', 'items.variant.product.translations', 'items.product.translations');

        $city = $request->city;

        // Pre-transaction checks give friendly, field-level errors; they are all
        // re-run against the locked cart inside the transaction, which is
        // authoritative — the cart may change between here and the lock.
        if ($error = $this->findCartError($cart, $city)) {
            return back()->withErrors($error);
        }

        $exchangeRate = $this->currency->getActiveRate();

        try {
            $order = DB::transaction(function () use ($request, $cart, $exchangeRate, $city) {
                // Pessimistic lock — serialises concurrent checkout attempts for the same cart
                $lockedCart = \Modules\Ordering\Models\Cart::lockForUpdate()->find($cart->id);

                if (! $lockedCart || $lockedCart->items()->count() === 0) {
                    throw new \RuntimeException('Your cart is empty or has already been processed.');
                }

                $lockedCart->load('items.variant.options', 'items.variant.product.translations', 'items.product.translations');

                if ($error = $this->findCartError($lockedCart, $city)) {
                    throw new \RuntimeException(implode(' ', $error));
                }

                // Totals must come from the locked cart so the charged amount always
                // matches the order lines created below.
                $totals = $this->cartService->computeTotals($lockedCart, $this->currency, $this->shipping, $city);

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
                foreach ($lockedCart->items as $item) {
                    $variant = $item->variant;
                    $product = $variant?->product ?? $item->product;
                    $translation = $product?->translations->firstWhere('locale', $locale)
                        ?? $product?->translations->firstWhere('locale', 'en');
                    $priceRmb = $variant ? $variant->price : ($product?->price ?? 0);
                    $unitPriceIdr = $this->currency->rmbToIdr($priceRmb);

                    $variantName = $variant?->options?->map(fn ($o) => $o->value)->implode(' / ')
                        ?: $variant?->sku;

                    OrderLine::create([
                        'order_id' => $order->id,
                        'product_id' => $product?->id,
                        'product_variant_id' => $variant?->id,
                        'product_name' => $translation?->name ?? $product?->slug,
                        'variant_name' => $variantName,
                        'sku' => $variant?->sku ?? $product?->slug ?? '-',
                        'unit_price_idr' => $unitPriceIdr,
                        'quantity' => $item->quantity,
                        'subtotal_idr' => $unitPriceIdr * $item->quantity,
                    ]);
                }

                CartItem::where('cart_id', $lockedCart->id)->delete();

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status' => 'pending',
                    'changed_by' => $request->user()->id,
                ]);

                return $order;
            });
        } catch (\RuntimeException $e) {
            return back()->withErrors(['cart' => $e->getMessage()]);
        }

        $order->load('lines');
        $snapToken = $this->payment->createSnapToken($order);

        return redirect()->route('checkout.complete', $order);
    }

    /**
     * Validate that every cart item is orderable and the totals are chargeable.
     * Returns an error bag (field => message) or null when the cart is valid.
     */
    private function findCartError(\Modules\Ordering\Models\Cart $cart, string $city): ?array
    {
        $hasUnavailable = $cart->items->contains(
            fn ($item) => $item->product_variant_id && $item->variant?->trashed()
        );
        if ($hasUnavailable) {
            return ['cart' => 'Some items in your cart are no longer available. Please remove them before proceeding.'];
        }

        // Every item must resolve to a positive price — a null/zero price means the
        // item was added through an invalid path (e.g. a variant product added by
        // product_id) and would otherwise be sold for free.
        $hasUnpriced = $cart->items->contains(function ($item) {
            $priceRmb = $item->variant ? $item->variant->price : $item->product?->price;

            return $priceRmb === null || $priceRmb <= 0;
        });
        if ($hasUnpriced) {
            return ['cart' => 'Some items in your cart are invalid. Please remove them before proceeding.'];
        }

        $totals = $this->cartService->computeTotals($cart, $this->currency, $this->shipping, $city);

        if ($totals['grand_total_idr'] <= 0) {
            return ['cart' => 'Your order total is invalid. Please review your cart before proceeding.'];
        }

        $canDeliver = strtolower($city) === 'jakarta'
            ? $totals['can_deliver_jakarta']
            : $totals['can_deliver_batam'];

        if (! $canDeliver) {
            return ['city' => 'Delivery is not available for the selected city.'];
        }

        return null;
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

        if (! $order) {
            return redirect()->route('orders.index');
        }

        abort_if($order->user_id !== $request->user()->id, 403);

        $this->payment->confirmFromTransaction($order);

        return redirect()->route('orders.show', $order);
    }
}
