<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStoreFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'icon'        => 'required|string|max:50',
            'title'       => 'required|string|max:100',
            'description' => 'required|string|max:200',
            'is_active'   => 'boolean',
        ];
    }
}
