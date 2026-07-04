<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Admin\Models\HeroSlide;
use Modules\Admin\Models\ShopSetting;
use Modules\Admin\Models\StoreFeature;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\Wishlist;
use Modules\Catalog\Services\ProductTransformer;

class HomeController extends Controller
{
    public function __construct(private ProductTransformer $transformer) {}

    public function index(Request $request)
    {
        $heroV     = Cache::get('cache_ver_hero', 0);
        $catV      = Cache::get('cache_ver_categories', 0);
        $settingsV = Cache::get('cache_ver_settings', 0);
        $productV  = Cache::get('cache_ver_products', 0);
        $featV     = Cache::get('cache_ver_features', 0);

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

        $transformer = $this->transformer;
        $locale = app()->getLocale();
        $products = Cache::remember("home_featured_products_{$productV}_{$locale}", 3600, fn () =>
            Product::with(['translations', 'variants', 'media'])
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->take(8)
                ->get()
                ->map(fn ($p) => $transformer->transform($p))
                ->values()
                ->all()
        );

        $storeFeatures = Cache::remember("store_features_{$featV}", 3600, fn () =>
            StoreFeature::orderBy('sort_order')
                ->get(['id', 'sort_order', 'icon', 'title', 'description', 'is_active'])
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
            'storeFeatures'   => $storeFeatures,
        ]);
    }
}
