<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => [
                'required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('pages', 'slug')->ignore($this->route('page')),
            ],
            'footer_section' => 'nullable|in:navigation,help,pages',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'translations' => 'required|array|min:1',
            'translations.en.title' => 'required|string|max:255',
            'translations.*.title' => 'nullable|string|max:255',
            'translations.*.content' => 'nullable|string',
        ];
    }
}
