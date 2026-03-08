<?php

namespace Modules\Ordering\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\CartItem;
use Modules\Ordering\Services\CartService;
use Modules\Ordering\Services\ShippingService;

class CartController extends Controller
{
    public function __construct(
        private CartService $cartService,
        private CurrencyService $currency,
        private ShippingService $shipping,
    ) {}

    public function index(Request $request)
    {
        $cart = $this->cartService->resolveCart($request);
        $cart->load(
            'items.variant.product.translations',
            'items.variant.product.media',
            'items.product.translations',
            'items.product.media'
        );
        $totals = $this->cartService->computeTotals($cart, $this->currency, $this->shipping);

        $locale = app()->getLocale();
        $cartData = [
            'id' => $cart->id,
            'user_id' => $cart->user_id,
            'session_id' => $cart->session_id,
            'items' => $cart->items->map(function ($item) use ($locale) {
                $variant = $item->variant;
                // For variant items: product comes from variant; for product items: direct product relation
                $product = $variant?->product ?? $item->product;
                $translation = $product?->translations->firstWhere('locale', $locale)
                    ?? $product?->translations->firstWhere('locale', 'en');
                $thumbnail = $product?->thumbnail
                    ?? ($product?->getFirstMediaUrl('images', 'thumb') ?: $product?->getFirstMediaUrl('images') ?: null);
                $priceRmb = $variant?->price ?? $product?->price ?? 0;

                return [
                    'id' => $item->id,
                    'cart_id' => $item->cart_id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
                    'variant' => $variant ? [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'price' => $variant->price,
                        'price_idr' => $this->currency->rmbToIdr($variant->price),
                        'product' => $product ? [
                            'id' => $product->id,
                            'slug' => $product->slug,
                            'thumbnail' => $thumbnail,
                            'name' => $translation?->name ?? $product->slug,
                        ] : null,
                    ] : ($product ? [
                        'id' => null,
                        'sku' => null,
                        'price' => $priceRmb,
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

        return Inertia::render('cart/index', [
            'cart' => $cartData,
            'totals' => $totals,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'product_id'         => 'nullable|integer|exists:products,id',
            'quantity'           => 'integer|min:1',
        ]);

        abort_if(! $request->product_variant_id && ! $request->product_id, 422, 'product_variant_id or product_id required');

        $cart = $this->cartService->resolveCart($request);
        $quantity = $request->input('quantity', 1);

        $existing = CartItem::where('cart_id', $cart->id)
            ->when(
                $request->product_variant_id,
                fn ($q) => $q->where('product_variant_id', $request->product_variant_id),
                fn ($q) => $q->whereNull('product_variant_id')->where('product_id', $request->product_id)
            )
            ->first();

        if ($existing) {
            $existing->increment('quantity', $quantity);
        } else {
            CartItem::create([
                'cart_id'            => $cart->id,
                'product_id'         => $request->product_variant_id ? null : $request->product_id,
                'product_variant_id' => $request->product_variant_id,
                'quantity'           => $quantity,
            ]);
        }

        return back();
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);
        $cartItem->update(['quantity' => $request->quantity]);

        return back();
    }

    public function destroy(CartItem $cartItem)
    {
        $cartItem->delete();

        return back();
    }
}
