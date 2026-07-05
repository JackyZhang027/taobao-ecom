<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\Wishlist;
use Modules\Currency\Services\CurrencyService;
use Modules\Delivery\Services\DeliveryService;

class WishlistController extends Controller
{
    public function __construct(private CurrencyService $currency, private DeliveryService $delivery) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $wishlists = Wishlist::where('user_id', $user->id)
            ->with(['product.translations', 'product.variants', 'product.media'])
            ->latest()
            ->get();

        $locale = app()->getLocale();

        $products = $wishlists->map(function ($wishlist) use ($locale) {
            $product = $wishlist->product;
            if (! $product || ! $product->is_active) {
                return null;
            }

            $translation = $product->translations->firstWhere('locale', $locale)
                ?? $product->translations->firstWhere('locale', 'en');

            $activeVariants = $product->variants->where('is_active', true);
            $minVariant = $activeVariants->sortBy('price')->first();
            $minPriceRmb = $minVariant !== null
                ? $minVariant->price
                : ($product->price ?? 0);

            if ($minVariant !== null) {
                $deliveryBatamIdr = $this->delivery->calculateCharge((float) ($minVariant->delivery_rate_batam ?? 0));
                $deliveryJakartaIdr = $this->delivery->calculateCharge((float) ($minVariant->delivery_rate_jakarta ?? 0));
            } else {
                $deliveryBatamIdr = $this->delivery->calculateCharge((float) ($product->delivery_rate_batam ?? 0));
                $deliveryJakartaIdr = $this->delivery->calculateCharge((float) ($product->delivery_rate_jakarta ?? 0));
            }

            $thumbnail = $product->thumbnail
                ?? ($product->getFirstMediaUrl('images', 'thumb') ?: $product->getFirstMediaUrl('images') ?: null);

            return [
                'id' => $product->id,
                'slug' => $product->slug,
                'thumbnail' => $thumbnail,
                'name' => $translation?->name ?? $product->slug,
                'description' => $translation?->description,
                'price_idr' => $this->currency->rmbToIdr($minPriceRmb),
                'price_rmb' => $minPriceRmb,
                'total_batam_idr' => $deliveryBatamIdr > 0 ? $this->currency->rmbToIdr($minPriceRmb) + $deliveryBatamIdr : null,
                'total_jakarta_idr' => $deliveryJakartaIdr > 0 ? $this->currency->rmbToIdr($minPriceRmb) + $deliveryJakartaIdr : null,
                'is_wishlisted' => true,
            ];
        })->filter()->values();

        return Inertia::render('wishlist/index', ['products' => $products]);
    }

    public function toggle(Request $request, Product $product)
    {
        $userId = $request->user()->id;

        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $product->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $wishlisted = false;
        } else {
            Wishlist::create(['user_id' => $userId, 'product_id' => $product->id]);
            $wishlisted = true;
        }

        return back()->with('wishlisted_'.$product->id, $wishlisted);
    }
}
