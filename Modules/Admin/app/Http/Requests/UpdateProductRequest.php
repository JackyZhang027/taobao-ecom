<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'slug'                                       => "required|string|alpha_dash|max:255|unique:products,slug,{$productId}",
            'thumbnail'                                  => 'nullable|string|max:500',
            'price'                                      => 'nullable|numeric|min:0',
            'delivery_rate_batam'                        => 'nullable|numeric|min:0',
            'delivery_rate_jakarta'                       => 'nullable|numeric|min:0',
            'show_delivery_charge'                       => 'boolean',
            'is_active'                                  => 'boolean',
            'sort_order'                                 => 'integer|min:0',
            'categories'                                 => 'required|array|min:1',
            'categories.*'                               => 'integer|exists:categories,id',
            'translations'                               => 'required|array|min:1',
            'translations.en.name'                       => 'required|string|max:255',
            'translations.*.name'                        => 'nullable|string|max:255',
            'translations.*.description'                 => 'nullable|string',
            'translations.*.meta_title'                  => 'nullable|string|max:255',
            'translations.*.meta_description'            => 'nullable|string|max:500',
            'translations.*.meta_keywords'               => 'nullable|string|max:255',
            'images'                                     => 'nullable|array',
            'images.*'                                   => 'image|max:10240',
            'deleted_images'                             => 'nullable|array',
            'deleted_images.*'                           => 'integer',
            'variant_groups'                             => 'nullable|array',
            'variant_groups.*.name'                      => 'required_with:variant_groups|string|max:100',
            'variant_groups.*.has_images'                => 'nullable|in:0,1,true,false',
            'variant_groups.*.options'                   => 'required_with:variant_groups|array|min:1',
            'variant_groups.*.options.*'                 => 'string|max:100',
            'variant_overrides'                          => 'nullable|array',
            'variant_overrides.*.id'                     => 'nullable|integer',
            'variant_overrides.*.price'                  => 'nullable|numeric|min:0',
            'variant_overrides.*.sku'                    => 'nullable|string|max:255',
            'variant_overrides.*.is_active'              => 'nullable|in:0,1,true,false',
            'variant_overrides.*.delivery_rate_batam'    => 'nullable|numeric|min:0',
            'variant_overrides.*.delivery_rate_jakarta'  => 'nullable|numeric|min:0',
            'group_option_images'                        => 'nullable|array',
            'group_option_images.*'                      => 'nullable|array',
            'group_option_images.*.*'                    => 'image|max:5120',
            'existing_option_images'                     => 'nullable|array',
            'existing_option_images.*'                   => 'nullable|array',
            'existing_option_images.*.*'                 => 'nullable|in:0,1',
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function ($v) {
            $hasVariantGroups = count($this->input('variant_groups', [])) > 0;

            if (! $hasVariantGroups) {
                if (! is_numeric($this->input('price')) || (float) $this->input('price') <= 0) {
                    $v->errors()->add('price', 'The price field is required and must be greater than 0.');
                }
                $batam   = (float) $this->input('delivery_rate_batam', 0);
                $jakarta = (float) $this->input('delivery_rate_jakarta', 0);
                if ($batam <= 0 && $jakarta <= 0) {
                    $v->errors()->add('delivery_rate_batam', 'At least one delivery rate (Batam or Jakarta) is required.');
                }

                $product = $this->route('product');
                if ($product) {
                    $variantIds = $product->variants()->pluck('id');

                    if ($variantIds->isNotEmpty()) {
                        $referencedInOrders = \Modules\Ordering\Models\OrderLine::whereIn('product_variant_id', $variantIds)->exists();
                        $referencedInCart   = \Modules\Ordering\Models\CartItem::whereIn('product_variant_id', $variantIds)->exists();

                        if ($referencedInOrders || $referencedInCart) {
                            $v->errors()->add(
                                'variant_groups',
                                'Cannot remove variants because they are referenced in existing orders or cart sessions. Deactivate the variants instead.'
                            );
                        }
                    }
                }
            }

            if ($hasVariantGroups) {
                foreach ($this->input('variant_overrides', []) as $i => $override) {
                    if (! isset($override['price']) || ! is_numeric($override['price']) || (float) $override['price'] <= 0) {
                        $v->errors()->add("variant_overrides.{$i}.price", 'Variant price is required and must be greater than 0.');
                    }
                    $batam   = (float) ($override['delivery_rate_batam'] ?? 0);
                    $jakarta = (float) ($override['delivery_rate_jakarta'] ?? 0);
                    if ($batam <= 0 && $jakarta <= 0) {
                        $v->errors()->add("variant_overrides.{$i}.delivery_rate_batam", 'At least one delivery rate (Batam or Jakarta) is required.');
                    }
                }
            }

            foreach ($this->input('variant_groups', []) as $gi => $group) {
                if (! filter_var($group['has_images'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    continue;
                }
                foreach (array_values($group['options'] ?? []) as $oi => $optionValue) {
                    if (trim($optionValue) === '') {
                        continue;
                    }
                    $hasNewFile      = $this->hasFile("group_option_images.{$gi}.{$oi}");
                    $hasExistingFlag = (bool) $this->input("existing_option_images.{$gi}.{$oi}");
                    if (! $hasNewFile && ! $hasExistingFlag) {
                        $v->errors()->add(
                            "group_option_images.{$gi}.{$oi}",
                            "An image is required for option \"{$optionValue}\"."
                        );
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'translations.required' => 'At least one translation with a product name is required.',
            'translations.min'      => 'At least one translation with a product name is required.',
        ];
    }
}
