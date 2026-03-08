<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Catalog\Models\AttributeType;
use Modules\Catalog\Models\AttributeValue;

class AttributeValueController extends Controller
{
    public function store(Request $request, AttributeType $attributeType)
    {
        $request->validate(['value' => 'required|string|max:100']);
        $attributeType->values()->create($request->only(['value', 'value_id', 'sort_order']));

        return back();
    }

    public function update(Request $request, AttributeValue $attributeValue)
    {
        $request->validate(['value' => 'required|string|max:100']);
        $attributeValue->update($request->only(['value', 'value_id', 'sort_order']));

        return back();
    }

    public function destroy(AttributeValue $attributeValue)
    {
        $attributeValue->delete();

        return back();
    }
}
