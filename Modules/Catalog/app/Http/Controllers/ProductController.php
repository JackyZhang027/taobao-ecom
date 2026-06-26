<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Admin\Models\ShopSetting;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\Wishlist;
use Modules\Catalog\Services\ProductTransformer;
use Modules\Currency\Services\CurrencyService;
use Modules\Delivery\Services\DeliveryService;

class ProductController extends Controller
{
    public function __construct(
        private CurrencyService $currency,
        private ProductTransformer $transformer,
        private DeliveryService $delivery,
    ) {}

    public function index(Request $request)
    {
        $query = Product::with(['translations', 'variants', 'categories', 'media'])
            ->where('is_active', true)
            ->orderBy('sort_order');

        if ($request->category) {
            $query->whereHas('categories', fn ($q) => $q->where('slug', $request->category));
        }

        if ($search = $request->input('search')) {
            $query->whereHas('translations', fn ($q) => $q->where('name', 'like', "%{$search}%"));
        }

        $user = $request->user();

        $catV      = Cache::get('cache_ver_categories', 0);
        $settingsV = Cache::get('cache_ver_settings', 0);
        $productV  = Cache::get('cache_ver_products', 0);

        $categories = Cache::remember("shop_all_categories_{$catV}", 3600, fn () =>
            Category::orderBy('sort_order')->get()
        );

        $shopSettings = Cache::remember("shop_settings_{$settingsV}", 3600, fn () =>
            ShopSetting::all()->pluck('value', 'key')
        );

        $transformer = $this->transformer;
        $filterKey = md5(serialize($request->only(['category', 'search', 'attributes', 'page'])));
        $paginatedData = Cache::remember("shop_products_{$filterKey}_{$productV}", 600, function () use ($query, $transformer) {
            return $query->paginate(12)
                ->through(fn ($p) => $transformer->transform($p))
                ->toArray();
        });

        if ($user) {
            $wishlistIds = Wishlist::where('user_id', $user->id)->pluck('product_id')->flip();
            $paginatedData['data'] = array_map(function ($p) use ($wishlistIds) {
                $p['is_wishlisted'] = $wishlistIds->has($p['id']);
                return $p;
            }, $paginatedData['data']);
        }

        $activeFilters = array_filter([
            'search' => $request->input('search') ?: null,
        ]);

        return Inertia::render('shop', [
            'products'        => $paginatedData,
            'categories'      => $categories,
            'currentCategory' => $request->category,
            'activeFilters'   => empty($activeFilters) ? (object) [] : $activeFilters,
            'whatsapp_number' => $shopSettings->get('whatsapp_number', ''),
        ]);
    }

    public function show(string $slug)
    {
        $productV = Cache::get('cache_ver_products', 0);
        $productData = Cache::remember("product_show_{$slug}_{$productV}", 3600, function () use ($slug) {
            $product = Product::with([
                'translations',
                'variants.options.group',
                'variants.options.media',
                'variants.media',
                'categories',
                'media',
            ])
                ->where('slug', $slug)
                ->where('is_active', true)
                ->firstOrFail();

            $locale = app()->getLocale();
            $translation = $product->translations->firstWhere('locale', $locale)
                ?? $product->translations->firstWhere('locale', 'en');

            $variants = $product->variants->where('is_active', true)->values()->map(fn ($v) => [
                'id'                          => $v->id,
                'sku'                         => $v->sku,
                'price_rmb'                   => $v->price,
                'price_idr'                   => $this->currency->rmbToIdr($v->price),
                'compare_price_idr'           => $v->compare_price ? $this->currency->rmbToIdr($v->compare_price) : null,
                'delivery_charge_batam'   => $this->delivery->calculateCharge((float) $v->delivery_rate_batam),
                'delivery_charge_jakarta' => $this->delivery->calculateCharge((float) $v->delivery_rate_jakarta),
                'is_active'                   => $v->is_active,
                'sort_order'                  => $v->sort_order,
                'image_url'                   => $v->getFirstMediaUrl('image') ?: null,
                'options'                     => $v->options->map(fn ($o) => [
                    'id'         => $o->id,
                    'value'      => $o->value,
                    'group_id'   => $o->group_id,
                    'group_name' => $o->group?->name,
                    'image_url'  => $o->getFirstMediaUrl('image') ?: null,
                ]),
            ]);

            $media = $product->getMedia('images')->map(fn ($m) => [
                'id'    => $m->id,
                'url'   => $m->getUrl('optimized') ?: $m->getUrl(),
                'thumb' => $m->getUrl('thumb') ?: $m->getUrl(),
            ])->values();

            $thumbnailUrl = $product->thumbnail
                ?? ($media->isNotEmpty() ? ($media->first()['thumb'] ?? $media->first()['url']) : null);

            return [
                'id'                          => $product->id,
                'slug'                        => $product->slug,
                'thumbnail'                   => $thumbnailUrl,
                'delivery_charge_batam'   => $this->delivery->calculateCharge((float) $product->delivery_rate_batam),
                'delivery_charge_jakarta' => $this->delivery->calculateCharge((float) $product->delivery_rate_jakarta),
                'show_delivery_charge'    => (bool) $product->show_delivery_charge,
                'name'                        => $translation?->name ?? $product->slug,
                'description'                 => $translation?->description,
                'price_rmb'                   => $product->price,
                'price_idr'                   => $product->price ? $this->currency->rmbToIdr($product->price) : null,
                'categories'                  => $product->categories->map(fn ($c) => [
                    'id'      => $c->id,
                    'name'    => $c->name,
                    'name_id' => $c->name_id,
                    'slug'    => $c->slug,
                ])->all(),
                'variants'                    => $variants,
                'media'                       => $media,
            ];
        });

        $settingsV = Cache::get('cache_ver_settings', 0);
        $shopSettings = Cache::remember("shop_settings_{$settingsV}", 3600, fn () =>
            ShopSetting::all()->pluck('value', 'key')
        );

        return Inertia::render('products/show', [
            'product'         => $productData,
            'whatsapp_number' => $shopSettings->get('whatsapp_number', ''),
        ]);
    }

}
