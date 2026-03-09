<?php

namespace Modules\Ordering\Services;

use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\Cart;

class ShippingService
{
    public function __construct(private CurrencyService $currency) {}

    public function calculateShippingRmb(Cart $cart, string $city = 'Batam'): float
    {
        return $cart->items
            ->load('variant.product', 'product')
            ->unique(fn ($item) => $item->variant?->product_id ?? ('p_' . $item->product_id))
            ->sum(function ($item) use ($city) {
                $product = $item->variant?->product ?? $item->product;
                if (! $product) {
                    return 0;
                }

                return match (strtolower($city)) {
                    'jakarta' => $product->delivery_charge_jakarta ?: $product->delivery_charge,
                    default   => $product->delivery_charge_batam ?: $product->delivery_charge,
                };
            });
    }

    public function calculateShippingIdr(Cart $cart, string $city = 'Batam'): float
    {
        return $this->currency->rmbToIdr($this->calculateShippingRmb($cart, $city));
    }
}
