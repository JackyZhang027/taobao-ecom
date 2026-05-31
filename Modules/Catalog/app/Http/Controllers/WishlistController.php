<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\Wishlist;
use Modules\Currency\Services\CurrencyService;

class WishlistController extends Controller
{
    public function __construct(private CurrencyService $currency) {}

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
            $minVariantPrice = $activeVariants->min('price');
            $minPriceRmb = $minVariantPrice !== null
                ? $minVariantPrice
                : ($product->price ?? 0);

            $deliveryBatamIdr = (float) ($product->delivery_charge_batam ?: $product->delivery_charge);
            $deliveryJakartaIdr = (float) ($product->delivery_charge_jakarta ?: $product->delivery_charge);

            $thumbnail = $product->thumbnail
                ?? ($product->getFirstMediaUrl('images', 'thumb') ?: $product->getFirstMediaUrl('images') ?: null);

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
                'is_wishlisted'     => true,
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

        return back()->with('wishlisted_' . $product->id, $wishlisted);
    }
}
