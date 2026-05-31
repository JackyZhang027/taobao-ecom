<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
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
use Yajra\DataTables\Facades\DataTables;

class ProductController extends Controller
{
    public function __construct(
        private CurrencyService $currency,
        private VariantGeneratorService $variantGenerator,
        private ProductVariantService $variantService,
    ) {}

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
            'categories'   => Category::all(),
            'variantGroups' => [],
            'exchangeRate' => $this->currency->getActiveRate(),
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        // Filter out empty translations
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['name']));

        $product = DB::transaction(function () use ($request, $translations) {
            $product = Product::create(array_merge(
                $request->only(['slug', 'thumbnail', 'price', 'delivery_charge', 'is_active', 'sort_order']),
                [
                    'delivery_charge_batam'   => $request->input('delivery_charge_batam') ?? 0,
                    'delivery_charge_jakarta' => $request->input('delivery_charge_jakarta') ?? 0,
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
            }

            if ($request->filled('variant_overrides')) {
                $this->variantService->bulkUpdate(
                    $product,
                    $request->input('variant_overrides'),
                    $request->file('variant_images', [])
                );
            }

            if ($request->hasFile('group_option_images')) {
                $this->variantService->syncOptionImages(
                    $product,
                    $request->input('variant_groups', []),
                    $request->file('group_option_images', [])
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
            'id'    => $m->id,
            'url'   => parse_url($m->getUrl(), PHP_URL_PATH),
            'thumb' => parse_url($m->getUrl('thumb'), PHP_URL_PATH),
        ]);

        $product->variants->transform(function ($variant) {
            $variant->image_url = $variant->getFirstMediaUrl('image') ?: null;
            $variant->option_key = $variant->option_key;
            $variant->options_data = $variant->options->map(fn ($o) => [
                'id'         => $o->id,
                'value'      => $o->value,
                'group_id'   => $o->group_id,
                'group_name' => $o->group?->name,
            ]);

            return $variant;
        });

        $variantGroups = $product->variantGroups->map(function ($group) {
            return [
                'id'         => $group->id,
                'name'       => $group->name,
                'sort_order' => $group->sort_order,
                'has_images' => (bool) $group->has_images,
                'options'    => $group->options->map(fn ($o) => [
                    'id'        => $o->id,
                    'group_id'  => $o->group_id,
                    'value'     => $o->value,
                    'sort_order' => $o->sort_order,
                    'image_url' => $o->getFirstMediaUrl('image') ?: null,
                ]),
            ];
        });

        return Inertia::render('admin/products/edit', [
            'product'       => $product,
            'categories'    => Category::all(),
            'variantGroups' => $variantGroups,
            'productMedia'  => $media,
            'exchangeRate'  => $this->currency->getActiveRate(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        // Filter out empty translations
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['name']));

        DB::transaction(function () use ($request, $product, $translations) {
            $product->update(array_merge(
                $request->only(['slug', 'thumbnail', 'price', 'delivery_charge', 'is_active', 'sort_order']),
                [
                    'delivery_charge_batam'   => $request->input('delivery_charge_batam') ?? 0,
                    'delivery_charge_jakarta' => $request->input('delivery_charge_jakarta') ?? 0,
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

            // Sync variant groups/combinations
            if ($request->filled('variant_groups')) {
                $this->variantGenerator->sync($product, $request->input('variant_groups'));
            }

            // Apply per-variant price/stock/SKU overrides
            if ($request->filled('variant_overrides')) {
                $this->variantService->bulkUpdate(
                    $product,
                    $request->input('variant_overrides'),
                    $request->file('variant_images', [])
                );
            }

            if ($request->hasFile('group_option_images')) {
                $this->variantService->syncOptionImages(
                    $product,
                    $request->input('variant_groups', []),
                    $request->file('group_option_images', [])
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
