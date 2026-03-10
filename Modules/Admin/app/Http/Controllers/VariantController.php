<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductVariant;

class VariantController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $request->validate([
            'sku' => 'required|string|unique:product_variants,sku',
            'price' => 'required|numeric|min:0',
        ]);

        $variant = $product->variants()->create(
            $request->only(['sku', 'price', 'compare_price', 'stock', 'is_active', 'sort_order'])
        );

        if ($request->attribute_value_ids) {
            $variant->attributeValues()->sync($request->attribute_value_ids);
        }

        Cache::forever('cache_ver_products', microtime(true));

        return back();
    }

    public function update(Request $request, ProductVariant $variant)
    {
        $request->validate(['price' => 'required|numeric|min:0']);

        $variant->update(
            $request->only(['sku', 'price', 'compare_price', 'stock', 'is_active', 'sort_order'])
        );

        if ($request->has('attribute_value_ids')) {
            $variant->attributeValues()->sync($request->attribute_value_ids);
        }

        Cache::forever('cache_ver_products', microtime(true));

        return back();
    }

    public function destroy(ProductVariant $variant)
    {
        $variant->delete();

        Cache::forever('cache_ver_products', microtime(true));

        return back();
    }
}
