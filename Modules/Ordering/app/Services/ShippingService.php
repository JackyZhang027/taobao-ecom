<?php

namespace Modules\Ordering\Services;

use Illuminate\Support\Facades\Log;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductVariant;
use Modules\Delivery\Services\DeliveryService;
use Modules\Ordering\Models\Cart;

class ShippingService
{
    public const CITIES = ['Batam', 'Jakarta'];

    public function __construct(private DeliveryService $delivery) {}

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

                $multiplier = $this->resolveMultiplier($product, $variant, $city);

                return $this->delivery->calculateCharge((float) $multiplier) * $item->quantity;
            });
    }

    public function resolveMultiplier(Product $product, ?ProductVariant $variant, string $city): float
    {
        if ($variant) {
            return match (strtolower($city)) {
                'jakarta' => $variant->delivery_rate_jakarta
                             ?: $variant->delivery_rate_batam
                             ?: $product->delivery_rate_jakarta,
                default => $variant->delivery_rate_batam
                             ?: $product->delivery_rate_batam,
            };
        }

        return match (strtolower($city)) {
            'jakarta' => $product->delivery_rate_jakarta,
            default => $product->delivery_rate_batam,
        };
    }
}
