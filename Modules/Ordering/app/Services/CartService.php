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

    /**
     * Read-only variant of resolveCart() — never inserts a cart row. Use on
     * every-request paths (e.g. shared Inertia props) so guests and crawlers
     * don't write a cart per session just by browsing.
     */
    public function findCart(Request $request): ?Cart
    {
        if ($request->user()) {
            return Cart::where('user_id', $request->user()->id)->first();
        }

        return Cart::where('session_id', $request->session()->getId())
            ->whereNull('user_id')
            ->first();
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
            default => $shippingBatamIdr,
        };
        $itemCount = $cart->items->sum('quantity');

        // Deliverability must mirror ShippingService::resolveMultiplier exactly —
        // an item whose resolved multiplier is 0 would otherwise ship for free.
        $canDeliver = fn (string $deliveryCity) => $cart->items->every(function ($item) use ($shipping, $deliveryCity) {
            $variant = $item->variant;
            $product = $variant?->product ?? $item->product;

            return $product && $shipping->resolveMultiplier($product, $variant, $deliveryCity) > 0;
        });
        $canDeliverBatam = $canDeliver('Batam');
        $canDeliverJakarta = $canDeliver('Jakarta');

        return [
            'subtotal_idr' => $subtotalIdr,
            'shipping_idr' => $shippingIdr,
            'shipping_batam_idr' => $shippingBatamIdr,
            'shipping_jakarta_idr' => $shippingJakartaIdr,
            'grand_total_idr' => $subtotalIdr + $shippingIdr,
            'item_count' => $itemCount,
            'city' => $city,
            'can_deliver_batam' => $canDeliverBatam,
            'can_deliver_jakarta' => $canDeliverJakarta,
        ];
    }
}
