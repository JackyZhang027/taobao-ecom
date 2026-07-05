<?php

namespace Modules\Catalog\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductVariant;
use Modules\Catalog\Models\ProductVariantGroup;
use Modules\Catalog\Models\ProductVariantOption;

class VariantGeneratorService
{
    /**
     * Sync product variant groups, options, and auto-generate combination rows.
     *
     * Options use soft-delete so their IDs are preserved across remove/re-add cycles.
     * This allows soft-deleted variants to be restored (with original price/stock/SKU)
     * when the same option value is re-added to a group.
     *
     * Scope: option restore only works when the GROUP still exists. If an entire group
     * is removed, its options are cascade-hard-deleted (group uses hard-delete) and
     * variants for that group start fresh on re-add.
     *
     * @param  array<int, array{name: string, has_images?: bool, options: string[]}>  $groups
     */
    public function sync(Product $product, array $groups): void
    {
        DB::transaction(function () use ($product, $groups) {
            $survivingGroupIds = [];
            $optionIdsByGroup = [];

            foreach ($groups as $sortOrder => $groupData) {
                $name = trim($groupData['name'] ?? '');
                $optionValues = array_filter(array_map('trim', $groupData['options'] ?? []));

                if ($name === '' || empty($optionValues)) {
                    continue;
                }

                $group = ProductVariantGroup::updateOrCreate(
                    ['product_id' => $product->id, 'name' => $name],
                    ['sort_order' => $sortOrder, 'has_images' => (bool) ($groupData['has_images'] ?? false)]
                );

                $survivingGroupIds[] = $group->id;
                $survivingOptionIds = [];

                foreach (array_values($optionValues) as $optionSortOrder => $value) {
                    // Include soft-deleted options so the same value gets its original ID back.
                    $option = ProductVariantOption::withTrashed()
                        ->where('group_id', $group->id)
                        ->where('value', $value)
                        ->first();

                    if ($option) {
                        if ($option->trashed()) {
                            $option->restore();
                        }
                        $option->update(['sort_order' => $optionSortOrder]);
                    } else {
                        $option = ProductVariantOption::create([
                            'group_id' => $group->id,
                            'value' => $value,
                            'sort_order' => $optionSortOrder,
                        ]);
                    }

                    $survivingOptionIds[] = $option->id;
                }

                // Soft-delete options no longer present — preserves IDs and assignments
                // so they can be restored if the same value is re-added later.
                ProductVariantOption::where('group_id', $group->id)
                    ->whereNotIn('id', $survivingOptionIds)
                    ->delete();

                $optionIdsByGroup[$group->id] = $survivingOptionIds;
            }

            // Hard-delete groups no longer present. The DB cascade will hard-delete
            // their options, which is intentional: removing an entire group is a
            // structural change and should not restore silently.
            ProductVariantGroup::where('product_id', $product->id)
                ->whereNotIn('id', $survivingGroupIds)
                ->delete();

            if (empty($optionIdsByGroup)) {
                // No groups remain — permanently remove all variant rows.
                // Validation has already blocked removal when any variant is referenced
                // in an order or cart, so forceDelete is safe here.
                $product->variants()->forceDelete();

                return;
            }

            $combinations = $this->cartesian(array_values($optionIdsByGroup));

            $newKeys = [];
            foreach ($combinations as $combo) {
                $sorted = $combo;
                sort($sorted);
                $newKeys[implode('|', $sorted)] = $combo;
            }

            // Load existing variants including soft-deleted ones.
            // Eager-load options WITH trashed so soft-deleted options are included in
            // the key — otherwise a variant whose options were just restored would have
            // an empty key and miss the match.
            $existing = $product->variants()
                ->withTrashed()
                ->with(['options' => fn ($q) => $q->withTrashed()])
                ->get()
                ->keyBy(function (ProductVariant $v) {
                    $ids = $v->options->pluck('id')->sort()->values()->toArray();

                    return implode('|', $ids);
                });

            foreach ($newKeys as $key => $combo) {
                if (isset($existing[$key])) {
                    $variant = $existing[$key];
                    if ($variant->trashed()) {
                        $variant->restore();
                    }
                    // Existing active variant: preserve its price/stock/SKU
                } else {
                    $optionValues = ProductVariantOption::withTrashed()
                        ->whereIn('id', $combo)
                        ->pluck('value')
                        ->toArray();

                    $variant = ProductVariant::create([
                        'product_id' => $product->id,
                        'sku' => $this->generateSku($product->slug, $optionValues),
                        'price' => 0,
                        'stock' => 0,
                        'is_active' => true,
                        'sort_order' => 0,
                    ]);

                    $variant->options()->sync($combo);
                }
            }

            foreach ($existing as $key => $variant) {
                if (! isset($newKeys[$key]) && ! $variant->trashed()) {
                    $variant->delete();
                }
            }
        });
    }

    private function cartesian(array $arrays): array
    {
        $result = [[]];
        foreach ($arrays as $array) {
            $append = [];
            foreach ($result as $product) {
                foreach ($array as $item) {
                    $append[] = [...$product, $item];
                }
            }
            $result = $append;
        }

        return $result;
    }

    private function generateSku(string $slug, array $optionValues): string
    {
        $base = Str::upper(Str::slug($slug, '-'));
        $suffix = collect($optionValues)
            ->map(fn ($v) => Str::upper(Str::slug($v, '-')))
            ->implode('-');

        return Str::limit("{$base}-{$suffix}", 190, '');
    }
}
