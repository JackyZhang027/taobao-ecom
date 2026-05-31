<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug'                              => 'required|string|unique:products,slug',
            'price'                             => 'required|numeric|min:0.01',
            'delivery_charge'                   => 'nullable|numeric|min:0',
            'delivery_charge_batam'             => 'nullable|numeric|min:0',
            'delivery_charge_jakarta'           => 'nullable|numeric|min:0',
            'is_active'                         => 'boolean',
            'sort_order'                        => 'integer|min:0',
            'categories'                        => 'required|array|min:1',
            'categories.*'                      => 'integer|exists:categories,id',
            'translations'                      => 'required|array|min:1',
            'translations.en.name'              => 'required|string|max:255',
            'translations.*.name'               => 'nullable|string|max:255',
            'translations.*.description'        => 'nullable|string',
            'translations.*.meta_title'         => 'nullable|string|max:255',
            'translations.*.meta_description'   => 'nullable|string|max:500',
            'translations.*.meta_keywords'      => 'nullable|string|max:255',
            'images'                            => 'nullable|array',
            'images.*'                          => 'image|max:10240',
            'variant_groups'                    => 'nullable|array',
            'variant_groups.*.name'             => 'required_with:variant_groups|string|max:100',
            'variant_groups.*.has_images'       => 'nullable|in:0,1,true,false',
            'variant_groups.*.options'          => 'required_with:variant_groups|array|min:1',
            'variant_groups.*.options.*'        => 'string|max:100',
            'variant_overrides'                 => 'nullable|array',
            'variant_overrides.*.price'         => 'nullable|numeric|min:0',
            'variant_overrides.*.sku'           => 'nullable|string|max:255',
            'variant_overrides.*.is_active'     => 'nullable|in:0,1,true,false',
            'group_option_images'               => 'nullable|array',
            'group_option_images.*'             => 'nullable|array',
            'group_option_images.*.*'           => 'image|max:5120',
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function ($v) {
            foreach ($this->input('variant_groups', []) as $gi => $group) {
                if (! filter_var($group['has_images'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    continue;
                }
                foreach (array_values($group['options'] ?? []) as $oi => $optionValue) {
                    if (trim($optionValue) !== '' && ! $this->hasFile("group_option_images.{$gi}.{$oi}")) {
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
