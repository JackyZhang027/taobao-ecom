<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
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
        $heroV     = Cache::get('cache_ver_hero', 0);
        $catV      = Cache::get('cache_ver_categories', 0);
        $settingsV = Cache::get('cache_ver_settings', 0);
        $productV  = Cache::get('cache_ver_products', 0);

        $heroSlides = Cache::remember("hero_slides_{$heroV}", 3600, fn () =>
            HeroSlide::with('media')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($slide) => [
                    'id'          => $slide->id,
                    'title'       => $slide->title,
                    'subtitle'    => $slide->subtitle,
                    'description' => $slide->description,
                    'cta_text'    => $slide->cta_text,
                    'cta_link'    => $slide->cta_link,
                    'image_url'   => $slide->getFirstMediaUrl('image', 'desktop') ?: $slide->getFirstMediaUrl('image'),
                ])
                ->all()
        );

        $categories = Cache::remember("home_all_categories_{$catV}", 3600, fn () =>
            Category::with('media')
                ->whereNull('parent_id')
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($c) => [
                    'id'        => $c->id,
                    'name'      => $c->name,
                    'name_id'   => $c->name_id,
                    'slug'      => $c->slug,
                    'image_url' => $c->getFirstMediaUrl('image', 'thumb') ?: $c->getFirstMediaUrl('image'),
                ])
                ->all()
        );

        $shopSettings = Cache::remember("shop_settings_{$settingsV}", 3600, fn () =>
            ShopSetting::all()->pluck('value', 'key')
        );

        $products = Cache::remember("home_featured_products_{$productV}", 3600, fn () =>
            Product::with(['translations', 'variants', 'media'])
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->take(8)
                ->get()
                ->map(fn ($p) => $this->transformProduct($p, collect([])))
                ->values()
                ->all()
        );

        $user = $request->user();

        if ($user) {
            $wishlistIds = Wishlist::where('user_id', $user->id)->pluck('product_id')->flip();
            $products = array_map(function ($p) use ($wishlistIds) {
                $p['is_wishlisted'] = $wishlistIds->has($p['id']);
                return $p;
            }, $products);
        }

        return Inertia::render('home', [
            'heroSlides'      => $heroSlides,
            'categories'      => $categories,
            'shopSettings'    => $shopSettings,
            'products'        => $products,
            'whatsapp_number' => $shopSettings->get('whatsapp_number', ''),
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
            ? $minVariantPrice
            : ($product->price ?? 0);

        $thumbnail = $product->thumbnail
            ?? ($product->getFirstMediaUrl('images', 'thumb') ?: $product->getFirstMediaUrl('images') ?: null);

        $deliveryBatamIdr = (float) ($product->delivery_charge_batam ?: $product->delivery_charge);
        $deliveryJakartaIdr = (float) ($product->delivery_charge_jakarta ?: $product->delivery_charge);

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
            'is_wishlisted'     => $wishlistProductIds ? $wishlistProductIds->has($product->id) : false,
        ];
    }
}
