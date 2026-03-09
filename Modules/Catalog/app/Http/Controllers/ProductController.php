<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Admin\Models\ShopSetting;
use Modules\Catalog\Models\AttributeType;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\Wishlist;
use Modules\Currency\Services\CurrencyService;

class ProductController extends Controller
{
    public function __construct(private CurrencyService $currency) {}

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

        if ($attrIds = $request->input('attributes')) {
            $ids = array_filter((array) $attrIds, fn ($v) => is_numeric($v));
            if (! empty($ids)) {
                $query->whereHas('variants.attributeValues', fn ($q) => $q->whereIn('attribute_values.id', $ids));
            }
        }

        $user = $request->user();
        $wishlistProductIds = $user
            ? Wishlist::where('user_id', $user->id)->pluck('product_id')->flip()
            : collect();

        $products = $query->paginate(12)->through(fn ($p) => $this->transformProduct($p, $wishlistProductIds));
        $categories = Category::orderBy('sort_order')->get();
        $attributeTypes = AttributeType::with('values')->orderBy('sort_order')->get();

        $activeFilters = array_filter([
            'search'     => $request->input('search') ?: null,
            'attributes' => $request->input('attributes')
                ? array_values(array_map('intval', (array) $request->input('attributes')))
                : null,
        ]);

        return Inertia::render('shop', [
            'products'         => $products,
            'categories'       => $categories,
            'currentCategory'  => $request->category,
            'attributeTypes'   => $attributeTypes,
            'activeFilters'    => empty($activeFilters) ? (object) [] : $activeFilters,
            'whatsapp_number'  => ShopSetting::get('whatsapp_number', ''),
        ]);
    }

    public function show(string $slug)
    {
        $product = Product::with(['translations', 'variants.attributeValues.type', 'categories', 'media'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $locale = app()->getLocale();
        $translation = $product->translations->firstWhere('locale', $locale)
            ?? $product->translations->firstWhere('locale', 'en');

        $variants = $product->variants->where('is_active', true)->map(fn ($v) => [
            'id' => $v->id,
            'sku' => $v->sku,
            'price_rmb' => $product->price + $v->price,
            'price_idr' => $this->currency->rmbToIdr($product->price + $v->price),
            'compare_price_idr' => $v->compare_price ? $this->currency->rmbToIdr($product->price + $v->compare_price) : null,
            'stock' => $v->stock,
            'is_active' => $v->is_active,
            'sort_order' => $v->sort_order,
            'attributes' => $v->attributeValues->map(fn ($av) => [
                'id' => $av->id,
                'value' => $av->value,
                'value_id' => $av->value_id,
                'type' => ['id' => $av->type->id, 'name' => $av->type->name, 'name_id' => $av->type->name_id],
            ]),
        ]);

        $media = $product->getMedia('images')->map(fn ($m) => [
            'id'    => $m->id,
            'url'   => $m->getUrl('optimized') ?: $m->getUrl(),
            'thumb' => $m->getUrl('thumb') ?: $m->getUrl(),
        ])->values();

        $thumbnailUrl = $product->thumbnail
            ?? ($media->isNotEmpty() ? ($media->first()['thumb'] ?? $media->first()['url']) : null);

        return Inertia::render('products/show', [
            'product' => [
                'id' => $product->id,
                'slug' => $product->slug,
                'thumbnail' => $thumbnailUrl,
                'delivery_charge_idr' => $this->currency->rmbToIdr($product->delivery_charge),
                'delivery_charge_batam_idr' => $this->currency->rmbToIdr($product->delivery_charge_batam ?: $product->delivery_charge),
                'delivery_charge_jakarta_idr' => $this->currency->rmbToIdr($product->delivery_charge_jakarta ?: $product->delivery_charge),
                'name' => $translation?->name ?? $product->slug,
                'description' => $translation?->description,
                'price_rmb' => $product->price,
                'price_idr' => $product->price ? $this->currency->rmbToIdr($product->price) : null,
                'categories' => $product->categories,
                'variants' => $variants,
                'media' => $media,
            ],
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
            'id'                  => $product->id,
            'slug'                => $product->slug,
            'thumbnail'           => $thumbnail,
            'name'                => $translation?->name ?? $product->slug,
            'description'         => $translation?->description,
            'price_idr'           => $this->currency->rmbToIdr($minPriceRmb),
            'price_rmb'           => $minPriceRmb,
            'total_batam_idr'     => $this->currency->rmbToIdr($minPriceRmb + $deliveryBatamRmb),
            'total_jakarta_idr'   => $this->currency->rmbToIdr($minPriceRmb + $deliveryJakartaRmb),
            'is_wishlisted'       => $wishlistProductIds ? $wishlistProductIds->has($product->id) : false,
        ];
    }
}
