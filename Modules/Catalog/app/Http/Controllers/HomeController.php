<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Admin\Models\HeroSlide;
use Modules\Admin\Models\ShopSetting;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\Wishlist;
use Modules\Currency\Services\CurrencyService;

class HomeController extends Controller
{
    public function __construct(private CurrencyService $currency) {}

    public function index(Request $request)
    {
        $heroSlides = HeroSlide::with('media')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($slide) => [
                'id' => $slide->id,
                'title' => $slide->title,
                'subtitle' => $slide->subtitle,
                'description' => $slide->description,
                'cta_text' => $slide->cta_text,
                'cta_link' => $slide->cta_link,
                'image_url' => $slide->getFirstMediaUrl('image', 'desktop') ?: $slide->getFirstMediaUrl('image'),
            ]);

        $categories = Category::with('media')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->take(3)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'name_id' => $c->name_id,
                'slug' => $c->slug,
                'image_url' => $c->getFirstMediaUrl('image', 'thumb') ?: $c->getFirstMediaUrl('image'),
            ]);

        $shopSettings = ShopSetting::all()->pluck('value', 'key');

        $user = $request->user();
        $wishlistProductIds = $user
            ? Wishlist::where('user_id', $user->id)->pluck('product_id')->flip()
            : collect();

        $products = Product::with(['translations', 'variants', 'media'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->take(8)
            ->get()
            ->map(fn ($p) => $this->transformProduct($p, $wishlistProductIds));

        return Inertia::render('home', [
            'heroSlides'      => $heroSlides,
            'categories'      => $categories,
            'shopSettings'    => $shopSettings,
            'products'        => $products,
            'whatsapp_number' => ShopSetting::get('whatsapp_number', ''),
        ]);
    }

    private function transformProduct(Product $product, $wishlistProductIds = null): array
    {
        $locale = app()->getLocale();
        $translation = $product->translations->firstWhere('locale', $locale)
            ?? $product->translations->firstWhere('locale', 'en');

        $activeVariants = $product->variants->where('is_active', true);
        $minVariantPrice = $activeVariants->min('price');
        $minPriceRmb = $minVariantPrice !== null
            ? ($product->price + $minVariantPrice)
            : ($product->price ?? 0);

        $thumbnail = $product->thumbnail
            ?? ($product->getFirstMediaUrl('images', 'thumb') ?: $product->getFirstMediaUrl('images') ?: null);

        $deliveryBatamRmb = $product->delivery_charge_batam ?: $product->delivery_charge;
        $deliveryJakartaRmb = $product->delivery_charge_jakarta ?: $product->delivery_charge;

        return [
            'id'                => $product->id,
            'slug'              => $product->slug,
            'thumbnail'         => $thumbnail,
            'name'              => $translation?->name ?? $product->slug,
            'description'       => $translation?->description,
            'price_idr'         => $this->currency->rmbToIdr($minPriceRmb),
            'price_rmb'         => $minPriceRmb,
            'total_batam_idr'   => $this->currency->rmbToIdr($minPriceRmb + $deliveryBatamRmb),
            'total_jakarta_idr' => $this->currency->rmbToIdr($minPriceRmb + $deliveryJakartaRmb),
            'is_wishlisted'     => $wishlistProductIds ? $wishlistProductIds->has($product->id) : false,
        ];
    }
}
