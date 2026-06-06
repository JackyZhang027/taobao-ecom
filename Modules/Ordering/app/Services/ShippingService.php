<?php

namespace Modules\Ordering\Services;

use Illuminate\Support\Facades\Log;
use Modules\Ordering\Models\Cart;

class ShippingService
{

    public function calculateShippingIdr(Cart $cart, string $city = 'Batam'): float
    {
        return $cart->items
            ->loadMissing('variant.product', 'product')
            ->sum(function ($item) use ($city) {
                $variant = $item->variant;
                $product = $variant?->product ?? $item->product;
                if (! $product) {
                    Log::warning('ShippingService: cart item has no resolvable product', ['cart_item_id' => $item->id]);

                    return 0;
                }

                if ($variant) {
                    $charge = match (strtolower($city)) {
                        'jakarta' => $variant->delivery_charge_jakarta
                                     ?: $variant->delivery_charge_batam
                                     ?: $product->delivery_charge_jakarta,
                        default   => $variant->delivery_charge_batam
                                     ?: $product->delivery_charge_batam,
                    };
                } else {
                    $charge = match (strtolower($city)) {
                        'jakarta' => $product->delivery_charge_jakarta,
                        default   => $product->delivery_charge_batam,
                    };
                }

                return $charge * $item->quantity;
            });
    }
}
