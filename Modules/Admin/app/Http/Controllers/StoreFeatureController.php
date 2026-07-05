<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Admin\Http\Requests\UpdateStoreFeatureRequest;
use Modules\Admin\Models\StoreFeature;

class StoreFeatureController extends Controller
{
    public function index()
    {
        $features = StoreFeature::orderBy('sort_order')->get();

        return Inertia::render('admin/settings/store-features/index', [
            'features' => $features,
        ]);
    }

    public function edit(StoreFeature $storeFeature)
    {
        return Inertia::render('admin/settings/store-features/edit', [
            'feature' => $storeFeature,
        ]);
    }

    public function update(UpdateStoreFeatureRequest $request, StoreFeature $storeFeature)
    {
        $storeFeature->update([
            'icon' => $request->icon,
            'title' => $request->title,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active'),
        ]);

        Cache::forever('cache_ver_features', microtime(true));

        return redirect()->route('admin.settings.store-features.index')
            ->with('success', 'Store feature updated successfully.');
    }
}
