<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Admin\Http\Requests\StoreProductRequest;
use Modules\Admin\Http\Requests\UpdateProductRequest;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductTranslation;
use Modules\Catalog\Services\ProductVariantService;
use Modules\Catalog\Services\VariantGeneratorService;
use Modules\Currency\Services\CurrencyService;
use Modules\Delivery\Services\DeliveryService;
use Yajra\DataTables\Facades\DataTables;

class ProductController extends Controller
{
    public function __construct(
        private CurrencyService $currency,
        private VariantGeneratorService $variantGenerator,
        private ProductVariantService $variantService,
        private DeliveryService $delivery,
    ) {}

    public function index()
    {
        return Inertia::render('admin/products/index', [
            'categories' => Category::orderBy('name')->get()->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->values(),
        ]);
    }

    private function applyFilters(Request $request, $query)
    {
        return $query
            ->when($request->status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($request->status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->when($request->filled('category_id') && $request->category_id !== 'all',
                fn ($q) => $q->whereHas('categories', fn ($c) => $c->where('categories.id', $request->category_id)))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = addcslashes($request->search, '%_\\');
                $q->where(function ($q) use ($term) {
                    $q->where('slug', 'like', "%{$term}%")
                        ->orWhereHas('translations', fn ($t) => $t->where('name', 'like', "%{$term}%"));
                });
            });
    }

    public function datatable(Request $request): JsonResponse
    {
        $query = $this->applyFilters($request, Product::with(['translations', 'media', 'variants'])->select('products.*'));

        return DataTables::of($query)
            ->addColumn('image', function ($p) {
                $url = $p->thumbnail
                    ?? ($p->getFirstMediaUrl('images', 'thumb') ?: $p->getFirstMediaUrl('images') ?: null);

                return $url
                    ? '<img src="'.htmlspecialchars($url, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8').'" alt="" class="h-12 w-12 object-cover rounded" />'
                    : '<span class="text-xs text-muted-foreground">—</span>';
            })
            ->addColumn('name', fn ($p) => $p->translations->firstWhere('locale', 'en')?->name ?? $p->slug)
            ->addColumn('price_display', function ($p) {
                $minVariantPrice = $p->variants->where('is_active', true)->min('price');

                return '¥'.number_format($minVariantPrice ?? $p->price, 2);
            })
            ->addColumn('delivery_charge_idr', function ($p) {
                $hasVariantPrice = $p->variants->where('is_active', true)->min('price') !== null;
                $rate = $hasVariantPrice
                    ? ($p->variants->where('is_active', true)->min('delivery_rate_batam') ?? 0)
                    : $p->delivery_rate_batam;

                return 'Rp '.number_format($this->delivery->calculateCharge((float) $rate), 0, '.', ',');
            })
            ->addColumn('final_price_idr', function ($p) {
                $minVariantPrice = $p->variants->where('is_active', true)->min('price');
                $price = $minVariantPrice ?? $p->price;
                $rate = $minVariantPrice !== null
                    ? ($p->variants->where('is_active', true)->min('delivery_rate_batam') ?? 0)
                    : $p->delivery_rate_batam;
                $batamIdr = $this->delivery->calculateCharge((float) $rate);

                return 'Rp '.number_format($this->currency->rmbToIdr($price) + $batamIdr, 0, '.', ',');
            })
            ->addColumn('status', fn ($p) => $p->is_active ? 'Active' : 'Inactive')
            ->addColumn('variants_count', fn ($p) => $p->variants->count())
            ->addColumn('actions', fn ($p) => ['id' => $p->id, 'slug' => $p->slug])
            ->rawColumns(['image', 'status'])
            ->make(true);
    }

    public function grid(Request $request): JsonResponse
    {
        $query = $this->applyFilters($request, Product::with(['translations', 'media', 'variants'])->select('products.*'));

        $paginator = $query->orderBy('sort_order')->orderByDesc('id')
            ->paginate(24)
            ->through(function ($p) {
                $minVariantPrice = $p->variants->where('is_active', true)->min('price');
                $isVariantPrice = $minVariantPrice !== null;
                $price = $isVariantPrice ? $minVariantPrice : $p->price;
                $batamRate = $isVariantPrice
                    ? ($p->variants->where('is_active', true)->min('delivery_rate_batam') ?? 0)
                    : $p->delivery_rate_batam;
                $batamIdr = $this->delivery->calculateCharge((float) $batamRate);

                return [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name' => $p->translations->firstWhere('locale', 'en')?->name ?? $p->slug,
                    'image' => $p->thumbnail
                        ?? ($p->getFirstMediaUrl('images', 'thumb') ?: $p->getFirstMediaUrl('images') ?: null),
                    'price_display' => '¥'.number_format($price, 2),
                    'final_price_idr' => 'Rp '.number_format($this->currency->rmbToIdr($price) + $batamIdr, 0, '.', ','),
                    'is_active' => (bool) $p->is_active,
                    'variants_count' => $p->variants->count(),
                ];
            });

        return response()->json($paginator);
    }

    public function create()
    {
        return Inertia::render('admin/products/create', [
            'categories' => Category::all(),
            'variantGroups' => [],
            'exchangeRate' => $this->currency->getActiveRate(),
            'deliveryRate' => $this->delivery->getActiveRate(),
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        // Filter out empty translations
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['name']));

        $product = DB::transaction(function () use ($request, $translations) {
            $product = Product::create(array_merge(
                $request->only(['slug', 'thumbnail', 'price', 'show_delivery_charge', 'is_active', 'sort_order']),
                [
                    'delivery_rate_batam' => $request->input('delivery_rate_batam') ?? 0,
                    'delivery_rate_jakarta' => $request->input('delivery_rate_jakarta') ?? 0,
                ]
            ));

            foreach ($translations as $locale => $data) {
                ProductTranslation::create(['product_id' => $product->id, 'locale' => $locale, ...$data]);
            }

            if ($request->has('categories')) {
                $product->categories()->sync($request->input('categories', []));
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $product->addMedia($image)->toMediaCollection('images');
                }
            }

            if ($request->filled('variant_groups')) {
                $this->variantGenerator->sync($product, $request->input('variant_groups'));

                // syncOptionImages is always called when variant groups are present;
                // the service skips gracefully when no files were uploaded.
                // Note: $request->hasFile() returns false for nested 2D file arrays.
                $this->variantService->syncOptionImages(
                    $product,
                    $request->input('variant_groups', []),
                    $request->file('group_option_images', [])
                );
            }

            if ($request->filled('variant_overrides')) {
                $this->variantService->bulkUpdate(
                    $product,
                    $request->input('variant_overrides'),
                    $request->file('variant_images', [])
                );
            }

            return $product;
        });

        Cache::forever('cache_ver_products', microtime(true));

        return redirect()->route('admin.products.edit', $product);
    }

    public function edit(Product $product)
    {
        $product->load([
            'translations',
            'variantGroups.options.media',
            'variants.options.group',
            'variants.media',
            'categories',
            'media',
        ]);

        $media = $product->getMedia('images')->map(fn ($m) => [
            'id' => $m->id,
            'url' => parse_url($m->getUrl(), PHP_URL_PATH),
            'thumb' => parse_url($m->getUrl('thumb'), PHP_URL_PATH),
        ]);

        $product->variants->transform(function ($variant) {
            $variant->image_url = $variant->getFirstMediaUrl('image') ?: null;
            $variant->option_key = $variant->option_key;
            $variant->options_data = $variant->options->map(fn ($o) => [
                'id' => $o->id,
                'value' => $o->value,
                'group_id' => $o->group_id,
                'group_name' => $o->group?->name,
            ]);

            return $variant;
        });

        $variantGroups = $product->variantGroups->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'sort_order' => $group->sort_order,
                'has_images' => (bool) $group->has_images,
                'options' => $group->options->map(fn ($o) => [
                    'id' => $o->id,
                    'group_id' => $o->group_id,
                    'value' => $o->value,
                    'sort_order' => $o->sort_order,
                    'image_url' => $o->getFirstMediaUrl('image') ?: null,
                ]),
            ];
        });

        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => Category::all(),
            'variantGroups' => $variantGroups,
            'productMedia' => $media,
            'exchangeRate' => $this->currency->getActiveRate(),
            'deliveryRate' => $this->delivery->getActiveRate(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        // Filter out empty translations
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['name']));

        DB::transaction(function () use ($request, $product, $translations) {
            $product->update(array_merge(
                $request->only(['slug', 'thumbnail', 'price', 'show_delivery_charge', 'is_active', 'sort_order']),
                [
                    'delivery_rate_batam' => $request->input('delivery_rate_batam') ?? 0,
                    'delivery_rate_jakarta' => $request->input('delivery_rate_jakarta') ?? 0,
                ]
            ));

            foreach ($translations as $locale => $data) {
                ProductTranslation::updateOrCreate(
                    ['product_id' => $product->id, 'locale' => $locale],
                    $data
                );
            }

            if ($request->has('categories')) {
                $product->categories()->sync($request->input('categories', []));
            }

            // Delete removed product images
            if ($request->filled('deleted_images')) {
                $product->media()->whereIn('id', $request->input('deleted_images'))->each(fn ($m) => $m->delete());
            }

            // Upload new product images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $product->addMedia($image)->toMediaCollection('images');
                }
            }

            // Sync variant groups/combinations (empty array removes all groups/variants)
            $variantGroups = $request->input('variant_groups', []);
            $this->variantGenerator->sync($product, $variantGroups);

            if (! empty($variantGroups)) {
                $this->variantService->syncOptionImages(
                    $product,
                    $variantGroups,
                    $request->file('group_option_images', [])
                );
            }

            // Apply per-variant price/stock/SKU overrides
            if ($request->filled('variant_overrides')) {
                $this->variantService->bulkUpdate(
                    $product,
                    $request->input('variant_overrides'),
                    $request->file('variant_images', [])
                );
            }
        });

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
