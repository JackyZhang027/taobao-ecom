<?php

namespace Modules\Ordering\Services;

use Modules\Currency\Services\CurrencyService;
use Modules\Ordering\Models\Cart;

class ShippingService
{
    public function __construct(private CurrencyService $currency) {}

    public function calculateShippingRmb(Cart $cart): float
    {
        return $cart->items
            ->load('variant.product', 'product')
            ->unique(fn ($item) => $item->variant?->product_id ?? ('p_' . $item->product_id))
            ->sum(fn ($item) => ($item->variant?->product ?? $item->product)?->delivery_charge ?? 0);
    }

    public function calculateShippingIdr(Cart $cart): float
    {
        return $this->currency->rmbToIdr($this->calculateShippingRmb($cart));
    }
}
