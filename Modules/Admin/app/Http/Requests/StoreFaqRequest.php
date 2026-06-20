<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFaqRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'translations' => 'required|array|min:1',
            'translations.en.question' => 'required|string|max:500',
            'translations.*.question' => 'nullable|string|max:500',
            'translations.*.answer' => 'nullable|string|max:5000',
        ];
    }
}
