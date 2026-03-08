<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Admin\Models\HeroSlide;
use Yajra\DataTables\Facades\DataTables;

class HeroSlideController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/settings/hero/index');
    }

    public function datatable()
    {
        $query = HeroSlide::query();
        
        return DataTables::of($query)
            ->addColumn('image_url', fn ($slide) => $slide->getFirstMediaUrl('image', 'thumb'))
            ->addColumn('status', fn ($slide) => $slide->is_active ? 'Active' : 'Inactive')
            ->addColumn('actions', fn ($slide) => $slide->id)
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/settings/hero/create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'cta_text' => 'nullable|string|max:255',
            'cta_link' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'image' => 'required|image|max:10240',
        ]);

        $data['sort_order'] = $data['sort_order'] ?? 0;
        
        $slide = HeroSlide::create($data);

        if ($request->hasFile('image')) {
            $slide->addMediaFromRequest('image')->toMediaCollection('image');
        }

        return redirect()->route('admin.settings.hero.index');
    }

    public function edit(HeroSlide $hero)
    {
        $hero->load('media');
        $imageUrl = $hero->getFirstMediaUrl('image');
        
        return Inertia::render('admin/settings/hero/edit', [
            'heroSlide' => $hero,
            'imageUrl' => $imageUrl ?: null,
        ]);
    }

    public function update(Request $request, HeroSlide $hero)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'cta_text' => 'nullable|string|max:255',
            'cta_link' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'image' => 'nullable|image|max:10240',
            'remove_image' => 'nullable|boolean',
        ]);

        $data['sort_order'] = $data['sort_order'] ?? 0;

        $hero->update($data);

        if ($request->boolean('remove_image')) {
            $hero->clearMediaCollection('image');
        } elseif ($request->hasFile('image')) {
            $hero->addMediaFromRequest('image')->toMediaCollection('image');
        }

        return redirect()->route('admin.settings.hero.index');
    }

    public function destroy(HeroSlide $hero)
    {
        $hero->delete();
        return redirect()->route('admin.settings.hero.index');
    }
}
