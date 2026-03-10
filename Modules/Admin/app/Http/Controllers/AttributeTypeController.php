<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Catalog\Models\AttributeType;
use Yajra\DataTables\Facades\DataTables;

class AttributeTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/attribute-types/index');
    }

    public function datatable(): JsonResponse
    {
        $query = AttributeType::with('values')->select('attribute_types.*');

        return DataTables::of($query)
            ->addColumn('values_list', fn ($at) => $at->values->pluck('value')->implode(', ') ?: '—')
            ->addColumn('actions', fn ($at) => $at->id)
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/attribute-types/create');
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);
        $attributeType = AttributeType::create($request->only(['name', 'name_id', 'sort_order']));

        // Create values if provided
        if ($request->values) {
            foreach ($request->values as $valueData) {
                if (!empty($valueData['value'])) {
                    $attributeType->values()->create($valueData);
                }
            }
        }

        Cache::forever('cache_ver_attributes', microtime(true));

        return redirect()->route('admin.attribute-types.index');
    }

    public function edit(AttributeType $attributeType)
    {
        $attributeType->load('values');

        return Inertia::render('admin/attribute-types/edit', [
            'attributeType' => $attributeType,
        ]);
    }

    public function update(Request $request, AttributeType $attributeType)
    {
        $request->validate(['name' => 'required|string|max:100']);
        $attributeType->update($request->only(['name', 'name_id', 'sort_order']));

        Cache::forever('cache_ver_attributes', microtime(true));

        return back();
    }

    public function destroy(AttributeType $attributeType)
    {
        $attributeType->delete();

        Cache::forever('cache_ver_attributes', microtime(true));

        return redirect()->route('admin.attribute-types.index');
    }
}
