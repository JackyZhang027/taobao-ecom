<?php

namespace Modules\Ordering\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\Cart;
use Modules\Ordering\Models\CartItem;

class CartService
{
    public function resolveCart(Request $request): Cart
    {
        if ($request->user()) {
            return Cart::firstOrCreate(['user_id' => $request->user()->id]);
        }

        $sessionId = $request->session()->getId();

        return Cart::firstOrCreate(['session_id' => $sessionId, 'user_id' => null]);
    }

    public function mergeGuestCart(User $user, string $sessionId): void
    {
        $guestCart = Cart::where('session_id', $sessionId)->where('user_id', null)->first();

        if (! $guestCart) {
            return;
        }

        $userCart = Cart::firstOrCreate(['user_id' => $user->id]);

        foreach ($guestCart->items as $guestItem) {
            $existing = CartItem::where('cart_id', $userCart->id)
                ->when($guestItem->product_variant_id,
                    fn ($q) => $q->where('product_variant_id', $guestItem->product_variant_id),
                    fn ($q) => $q->whereNull('product_variant_id')->where('product_id', $guestItem->product_id)
                )
                ->first();

            if ($existing) {
                $existing->increment('quantity', $guestItem->quantity);
            } else {
                CartItem::create([
                    'cart_id' => $userCart->id,
                    'product_id' => $guestItem->product_id,
                    'product_variant_id' => $guestItem->product_variant_id,
                    'quantity' => $guestItem->quantity,
                ]);
            }
        }

        $guestCart->delete();
    }

    public function computeTotals(Cart $cart, CurrencyService $currency, ShippingService $shipping, string $city = 'Batam'): array
    {
        $cart->load('items.variant.product', 'items.product');

        $subtotalRmb = $cart->items->sum(function ($item) {
            $priceRmb = $item->variant
                ? $item->variant->price
                : ($item->product?->price ?? 0);

            return $priceRmb * $item->quantity;
        });
        $subtotalIdr = $currency->rmbToIdr($subtotalRmb);
        $shippingBatamIdr = $shipping->calculateShippingIdr($cart, 'Batam');
        $shippingJakartaIdr = $shipping->calculateShippingIdr($cart, 'Jakarta');
        $shippingIdr = match (strtolower($city)) {
            'jakarta' => $shippingJakartaIdr,
            default   => $shippingBatamIdr,
        };
        $itemCount = $cart->items->sum('quantity');

        $uniqueItems = $cart->items->unique(
            fn ($item) => $item->variant?->product_id ?? ('p_' . $item->product_id)
        );
        $canDeliverBatam = $uniqueItems->every(function ($item) {
            $variant = $item->variant;
            $product = $variant?->product ?? $item->product;
            if ($variant && ($variant->delivery_rate_batam ?: $variant->delivery_rate_jakarta)) {
                return true;
            }
            return $product && $product->delivery_rate_batam > 0;
        });
        $canDeliverJakarta = $uniqueItems->every(function ($item) {
            $variant = $item->variant;
            $product = $variant?->product ?? $item->product;
            if ($variant && ($variant->delivery_rate_jakarta ?: $variant->delivery_rate_batam)) {
                return true;
            }
            return $product && $product->delivery_rate_jakarta > 0;
        });

        return [
            'subtotal_idr'         => $subtotalIdr,
            'shipping_idr'         => $shippingIdr,
            'shipping_batam_idr'   => $shippingBatamIdr,
            'shipping_jakarta_idr' => $shippingJakartaIdr,
            'grand_total_idr'      => $subtotalIdr + $shippingIdr,
            'item_count'           => $itemCount,
            'city'                 => $city,
            'can_deliver_batam'    => $canDeliverBatam,
            'can_deliver_jakarta'  => $canDeliverJakarta,
        ];
    }
}
