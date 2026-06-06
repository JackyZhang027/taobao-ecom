<?php

namespace Modules\Catalog\Services;

use Illuminate\Http\UploadedFile;
use Modules\Catalog\Models\Product;

class ProductVariantService
{
    /**
     * Bulk-update variant fields from the admin form submission.
     *
     * @param  array<int, array{id?: int, price?: string, compare_price?: string, stock?: string, sku?: string, is_active?: string, clear_image?: string}>  $overrides
     * @param  array<int, UploadedFile>  $imageFiles
     */
    public function bulkUpdate(Product $product, array $overrides, array $imageFiles): void
    {
        $variantMap = $product->variants()
            ->withTrashed()
            ->get()
            ->keyBy('id');

        foreach ($overrides as $index => $data) {
            $variantId = isset($data['id']) ? (int) $data['id'] : null;

            if ($variantId === null || ! $variantMap->has($variantId)) {
                continue;
            }

            $variant = $variantMap->get($variantId);

            if ($variant->trashed()) {
                continue;
            }

            $variant->update([
                'price'                   => isset($data['price']) ? (float) $data['price'] : $variant->price,
                'compare_price'           => isset($data['compare_price']) && $data['compare_price'] !== ''
                    ? (float) $data['compare_price']
                    : null,
                'delivery_charge_batam'   => isset($data['delivery_charge_batam'])
                    ? (float) $data['delivery_charge_batam']
                    : $variant->delivery_charge_batam,
                'delivery_charge_jakarta' => isset($data['delivery_charge_jakarta'])
                    ? (float) $data['delivery_charge_jakarta']
                    : $variant->delivery_charge_jakarta,
                'stock'                   => isset($data['stock']) ? (int) $data['stock'] : $variant->stock,
                'sku'                     => $data['sku'] ?? $variant->sku,
                'is_active'               => isset($data['is_active'])
                    ? filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN)
                    : $variant->is_active,
            ]);

            if (isset($imageFiles[$index]) && $imageFiles[$index] instanceof UploadedFile) {
                $variant->clearMediaCollection('image');
                $variant->addMedia($imageFiles[$index])->toMediaCollection('image');
            } elseif (! empty($data['clear_image'])) {
                $variant->clearMediaCollection('image');
            }
        }
    }

    /**
     * Save option-level images for the image group (Shopee-style).
     *
     * Matches submitted group/option by name+value to the DB records created by VariantGeneratorService::sync().
     *
     * @param  array<int, array{name: string, options: string[]}>  $groups  raw variant_groups input
     * @param  array<int, array<int, UploadedFile>>  $imageFiles  group_option_images[gi][oi]
     */
    public function syncOptionImages(Product $product, array $groups, array $imageFiles): void
    {
        foreach ($groups as $gi => $groupData) {
            if (! isset($imageFiles[$gi])) {
                continue;
            }

            $groupName = trim($groupData['name'] ?? '');
            if ($groupName === '') {
                continue;
            }

            $group = $product->variantGroups()->where('name', $groupName)->first();
            if (! $group) {
                continue;
            }

            foreach ($groupData['options'] ?? [] as $oi => $optionValue) {
                if (! isset($imageFiles[$gi][$oi]) || ! ($imageFiles[$gi][$oi] instanceof UploadedFile)) {
                    continue;
                }

                $option = $group->options()->where('value', trim($optionValue))->first();
                if (! $option) {
                    continue;
                }

                $option->clearMediaCollection('image');
                $option->addMedia($imageFiles[$gi][$oi])->toMediaCollection('image');
            }
        }
    }
}
