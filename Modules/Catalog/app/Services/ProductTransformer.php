<?php

namespace Modules\Catalog\Services;

use Modules\Catalog\Models\Product;
use Modules\Currency\Services\CurrencyService;

class ProductTransformer
{
    public function __construct(private CurrencyService $currency) {}

    public function transform(Product $product, bool $isWishlisted = false): array
    {
        $locale = app()->getLocale();
        $translation = $product->translations->firstWhere('locale', $locale)
            ?? $product->translations->firstWhere('locale', 'en');

        $activeVariants = $product->variants->where('is_active', true);
        $minVariant     = $activeVariants->sortBy('price')->first();

        $thumbnail = $product->thumbnail
            ?? ($product->getFirstMediaUrl('images', 'thumb') ?: $product->getFirstMediaUrl('images') ?: null);

        if ($minVariant !== null) {
            $minPriceRmb        = (float) $minVariant->price;
            $deliveryBatamIdr   = (float) ($minVariant->delivery_charge_batam ?? 0);
            $deliveryJakartaIdr = (float) ($minVariant->delivery_charge_jakarta ?? 0);
        } else {
            $minPriceRmb        = (float) ($product->price ?? 0);
            $deliveryBatamIdr   = (float) ($product->delivery_charge_batam ?? 0);
            $deliveryJakartaIdr = (float) ($product->delivery_charge_jakarta ?? 0);
        }

        return [
            'id'                => $product->id,
            'slug'              => $product->slug,
            'thumbnail'         => $thumbnail,
            'name'              => $translation?->name ?? $product->slug,
            'description'       => $translation?->description,
            'price_idr'         => $this->currency->rmbToIdr($minPriceRmb),
            'price_rmb'         => $minPriceRmb,
            'total_batam_idr'   => $deliveryBatamIdr > 0 ? $this->currency->rmbToIdr($minPriceRmb) + $deliveryBatamIdr : null,
            'total_jakarta_idr' => $deliveryJakartaIdr > 0 ? $this->currency->rmbToIdr($minPriceRmb) + $deliveryJakartaIdr : null,
            'is_wishlisted'     => $isWishlisted,
        ];
    }
}
