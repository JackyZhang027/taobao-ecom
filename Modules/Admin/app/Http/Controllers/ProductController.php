<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Catalog\Models\AttributeType;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductTranslation;
use Modules\Catalog\Models\ProductVariant;
use Modules\Currency\Services\CurrencyService;
use Yajra\DataTables\Facades\DataTables;

class ProductController extends Controller
{
    public function __construct(private CurrencyService $currency) {}

    public function index()
    {
        return Inertia::render('admin/products/index');
    }

    public function datatable(): JsonResponse
    {
        $query = Product::with(['translations', 'media'])->select('products.*');

        return DataTables::of($query)
            ->addColumn('image', function ($p) {
                $url = $p->thumbnail
                    ?? ($p->getFirstMediaUrl('images', 'thumb') ?: $p->getFirstMediaUrl('images') ?: null);

                return $url
                    ? '<img src="'.htmlspecialchars($url, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8').'" alt="" class="h-12 w-12 object-cover rounded" />'
                    : '<span class="text-xs text-muted-foreground">—</span>';
            })
            ->addColumn('name', fn ($p) => $p->translations->firstWhere('locale', 'en')?->name ?? $p->slug)
            ->addColumn('price_display', fn ($p) => '¥'.number_format($p->price, 2))
            ->addColumn('delivery_charge_idr', fn ($p) => 'Rp '.number_format($p->delivery_charge_batam ?: $p->delivery_charge, 0, '.', ','))
            ->addColumn('final_price_idr', fn ($p) => 'Rp '.number_format($this->currency->rmbToIdr($p->price) + ($p->delivery_charge_batam ?: $p->delivery_charge), 0, '.', ','))
            ->addColumn('status', fn ($p) => $p->is_active ? 'Active' : 'Inactive')
            ->addColumn('variants_count', fn ($p) => $p->variants()->count())
            ->addColumn('actions', fn ($p) => $p->id)
            ->rawColumns(['image', 'status', 'actions'])
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/products/create', [
            'categories' => Category::all(),
            'attributeTypes' => AttributeType::with('values')->get(),
            'exchangeRate' => $this->currency->getActiveRate(),
        ]);
    }

    public function store(Request $request)
    {
        // Filter out empty translations to avoid validation errors for optional languages
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['name']));
        $request->merge(['translations' => $translations]);

        $request->validate([
            'slug' => 'required|string|unique:products,slug',
            'price' => 'required|numeric|min:0.01',
            'delivery_charge' => 'numeric|min:0',
            'delivery_charge_batam' => 'nullable|numeric|min:0',
            'delivery_charge_jakarta' => 'nullable|numeric|min:0',
            'categories' => 'required|array|min:1',
            'translations' => 'required|array|min:1',
            'translations.*.name' => 'required|string|max:255',
            'variants' => 'nullable|array',
            'variants.*.sku' => 'required_with:variants|string|max:255',
            'translations.*.meta_title' => 'nullable|string|max:255',
            'translations.*.meta_description' => 'nullable|string|max:500',
            'translations.*.meta_keywords' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|max:10240',
            'variants.*.image' => 'required_with:variants|image|max:5120',
        ], [
            'translations.required' => 'At least one translation with a product name is required.',
            'translations.min' => 'At least one translation with a product name is required.',
            'variants.*.image.required_with' => 'Each variant must have an image.',
        ]);

        $product = Product::create(array_merge(
            $request->only(['slug', 'thumbnail', 'price', 'delivery_charge', 'is_active', 'sort_order']),
            [
                'delivery_charge_batam' => $request->input('delivery_charge_batam') ?? 0,
                'delivery_charge_jakarta' => $request->input('delivery_charge_jakarta') ?? 0,
            ]
        ));

        foreach ($request->translations as $locale => $data) {
            ProductTranslation::create(['product_id' => $product->id, 'locale' => $locale, ...$data]);
        }

        if ($request->categories) {
            $product->categories()->sync($request->categories);
        }

        // Handle image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $product->addMedia($image)->toMediaCollection('images');
            }
        }

        foreach ($request->variants ?? [] as $vi => $variantData) {
            $variant = $product->variants()->create([
                'sku' => $variantData['sku'] ?? null,
                'price' => $variantData['price'] ?? 0,
                'compare_price' => $variantData['compare_price'] ?? null,
                'stock' => $variantData['stock'] ?? 0,
                'is_active' => $variantData['is_active'] ?? true,
                'sort_order' => $variantData['sort_order'] ?? 0,
            ]);
            if (! empty($variantData['attribute_value_ids'])) {
                $variant->attributeValues()->sync($variantData['attribute_value_ids']);
            }
            if ($request->hasFile("variants.{$vi}.image")) {
                $variant->addMediaFromRequest("variants.{$vi}.image")->toMediaCollection('image');
            }
        }

        Cache::forever('cache_ver_products', microtime(true));

        return redirect()->route('admin.products.edit', $product);
    }

    public function edit(Product $product)
    {
        $product->load(['translations', 'variants.attributeValues', 'variants.media', 'categories', 'media']);

        $media = $product->getMedia('images')->map(fn ($m) => [
            'id' => $m->id,
            'url' => parse_url($m->getUrl(), PHP_URL_PATH),
            'thumb' => parse_url($m->getUrl('thumb'), PHP_URL_PATH),
        ]);

        $product->variants->transform(function ($variant) {
            $variant->image_url = $variant->getFirstMediaUrl('image') ?: null;

            return $variant;
        });

        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => Category::all(),
            'attributeTypes' => AttributeType::with('values')->get(),
            'productMedia' => $media,
            'exchangeRate' => $this->currency->getActiveRate(),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        // Filter out empty translations
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['name']));
        $request->merge(['translations' => $translations]);

        $request->validate([
            'slug' => 'required|string|unique:products,slug,'.$product->id,
            'price' => 'required|numeric|min:0.01',
            'delivery_charge' => 'numeric|min:0',
            'delivery_charge_batam' => 'nullable|numeric|min:0',
            'delivery_charge_jakarta' => 'nullable|numeric|min:0',
            'categories' => 'required|array|min:1',
            'variants' => 'nullable|array',
            'variants.*.sku' => 'required_with:variants|string|max:255',
            'translations' => 'required|array|min:1',
            'translations.*.name' => 'required|string|max:255',
            'translations.*.meta_title' => 'nullable|string|max:255',
            'translations.*.meta_description' => 'nullable|string|max:500',
            'translations.*.meta_keywords' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|max:10240',
        ], [
            'translations.required' => 'At least one translation with a product name is required.',
            'translations.min' => 'At least one translation with a product name is required.',
        ]);

        $product->update(array_merge(
            $request->only(['slug', 'thumbnail', 'price', 'delivery_charge', 'is_active', 'sort_order']),
            [
                'delivery_charge_batam' => $request->input('delivery_charge_batam') ?? 0,
                'delivery_charge_jakarta' => $request->input('delivery_charge_jakarta') ?? 0,
            ]
        ));

        foreach ($request->translations ?? [] as $locale => $data) {
            ProductTranslation::updateOrCreate(
                ['product_id' => $product->id, 'locale' => $locale],
                $data
            );
        }

        if ($request->has('categories')) {
            $product->categories()->sync($request->categories);
        }

        // Handle image deletion
        if ($request->deleted_images) {
            $product->media()->whereIn('id', $request->deleted_images)->each(fn ($m) => $m->delete());
        }

        // Handle new image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $product->addMedia($image)->toMediaCollection('images');
            }
        }

        // Handle variants: upsert existing, create new, delete removed
        $incomingIds = [];
        foreach ($request->variants ?? [] as $vi => $variantData) {
            $variantFields = [
                'sku' => $variantData['sku'] ?? null,
                'price' => $variantData['price'] ?? 0,
                'compare_price' => $variantData['compare_price'] ?? null,
                'stock' => $variantData['stock'] ?? 0,
                'is_active' => $variantData['is_active'] ?? true,
                'sort_order' => $variantData['sort_order'] ?? 0,
            ];
            if (! empty($variantData['id'])) {
                $variant = ProductVariant::find($variantData['id']);
                if ($variant && $variant->product_id === $product->id) {
                    $variant->update($variantFields);
                    $incomingIds[] = $variant->id;
                }
            } else {
                $variant = $product->variants()->create($variantFields);
                $incomingIds[] = $variant->id;
            }
            if (! empty($variantData['attribute_value_ids'])) {
                $variant->attributeValues()->sync($variantData['attribute_value_ids']);
            } else {
                $variant->attributeValues()->detach();
            }
            if ($request->hasFile("variants.{$vi}.image")) {
                $variant->clearMediaCollection('image');
                $variant->addMediaFromRequest("variants.{$vi}.image")->toMediaCollection('image');
            }
        }

        // Delete variants not in the incoming list
        if (! empty($incomingIds)) {
            $product->variants()->whereNotIn('id', $incomingIds)->delete();
        } elseif ($request->has('variants')) {
            $product->variants()->delete();
        }

        Cache::forever('cache_ver_products', microtime(true));

        return redirect()->back();
    }

    public function destroy(Product $product)
    {
        $product->delete();

        Cache::forever('cache_ver_products', microtime(true));

        return redirect()->route('admin.products.index');
    }
}
