<?php

namespace Modules\Ordering\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\CartItem;
use Modules\Ordering\Models\Order;
use Modules\Ordering\Models\OrderLine;
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
        $cart->load('items.variant.product.translations');
        $totals = $this->cartService->computeTotals($cart, $this->currency, $this->shipping);

        return Inertia::render('checkout/index', [
            'cart' => $cart,
            'totals' => $totals,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:30',
            'shipping_address' => 'required|string',
        ]);

        $cart = $this->cartService->resolveCart($request);
        $cart->load('items.variant.product.translations', 'items.product.translations');

        $totals = $this->cartService->computeTotals($cart, $this->currency, $this->shipping);
        $exchangeRate = $this->currency->getActiveRate();

        $order = DB::transaction(function () use ($request, $cart, $totals, $exchangeRate) {
            $order = Order::create([
                'user_id' => $request->user()->id,
                'status' => 'pending',
                'subtotal_idr' => $totals['subtotal_idr'],
                'shipping_idr' => $totals['shipping_idr'],
                'grand_total_idr' => $totals['grand_total_idr'],
                'exchange_rate_snapshot' => $exchangeRate,
                'recipient_name' => $request->recipient_name,
                'recipient_phone' => $request->recipient_phone,
                'shipping_address' => $request->shipping_address,
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
                    'order_id'           => $order->id,
                    'product_id'         => $product?->id,
                    'product_variant_id' => $variant?->id,
                    'product_name'       => $translation?->name ?? $product?->slug,
                    'variant_name'       => $variant?->sku,
                    'sku'                => $variant?->sku ?? $product?->slug ?? '-',
                    'unit_price_idr'     => $unitPriceIdr,
                    'quantity'           => $item->quantity,
                    'subtotal_idr'       => $unitPriceIdr * $item->quantity,
                ]);
            }

            CartItem::where('cart_id', $cart->id)->delete();

            return $order;
        });

        $order->load('lines');
        $snapToken = $this->payment->createSnapToken($order);

        return redirect()->route('checkout.complete', $order)->with([
            'snapToken' => $snapToken,
            'clientKey' => config('midtrans.client_key'),
        ]);
    }

    public function complete(Request $request, Order $order)
    {
        return Inertia::render('checkout/complete', [
            'order' => $order->load('lines'),
            'snapToken' => session('snapToken'),
            'clientKey' => session('clientKey'),
            'isProduction' => config('midtrans.is_production', false),
        ]);
    }
}
