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

    public function computeTotals(Cart $cart, CurrencyService $currency, ShippingService $shipping): array
    {
        $cart->load('items.variant.product', 'items.product');

        $subtotalRmb = $cart->items->sum(fn ($item) => (($item->product?->price ?? 0) + ($item->variant?->price ?? 0)) * $item->quantity);
        $subtotalIdr = $currency->rmbToIdr($subtotalRmb);
        $shippingIdr = $shipping->calculateShippingIdr($cart);
        $itemCount = $cart->items->sum('quantity');

        return [
            'subtotal_idr' => $subtotalIdr,
            'shipping_idr' => $shippingIdr,
            'grand_total_idr' => $subtotalIdr + $shippingIdr,
            'item_count' => $itemCount,
        ];
    }
}
