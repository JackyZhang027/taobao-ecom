<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Admin\Http\Requests\StorePageRequest;
use Modules\Admin\Http\Requests\UpdatePageRequest;
use Modules\Admin\Models\Page;
use Modules\Admin\Models\PageTranslation;
use Yajra\DataTables\Facades\DataTables;

class PageController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/settings/pages/index');
    }

    public function datatable()
    {
        $query = Page::with('translations');

        return DataTables::of($query)
            ->addColumn('title', fn (Page $page) => $page->title)
            ->addColumn('footer_section', fn (Page $page) => $page->footer_section ?? '—')
            ->addColumn('status', fn (Page $page) => $page->is_active ? 'Active' : 'Inactive')
            ->addColumn('actions', fn (Page $page) => $page->id)
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/settings/pages/create');
    }

    public function store(StorePageRequest $request)
    {
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['title']));

        DB::transaction(function () use ($request, $translations) {
            $page = Page::create([
                'slug' => $request->slug,
                'footer_section' => $request->footer_section,
                'sort_order' => $request->input('sort_order') ?? 0,
                'is_active' => $request->boolean('is_active'),
            ]);

            foreach ($translations as $locale => $data) {
                PageTranslation::create([
                    'page_id' => $page->id,
                    'locale' => $locale,
                    'title' => $data['title'] ?? '',
                    'content' => $data['content'] ?? null,
                ]);
            }
        });

        Cache::forever('cache_ver_pages', microtime(true));

        return redirect()->route('admin.settings.pages.index')
            ->with('success', 'Page created successfully.');
    }

    public function edit(Page $page)
    {
        $page->load('translations');

        return Inertia::render('admin/settings/pages/edit', [
            'page' => [
                'id' => $page->id,
                'slug' => $page->slug,
                'footer_section' => $page->footer_section,
                'sort_order' => $page->sort_order,
                'is_active' => $page->is_active,
                'translations' => $page->translations->keyBy('locale')->map(fn ($t) => [
                    'title' => $t->title,
                    'content' => $t->content,
                ]),
            ],
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page)
    {
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['title']));

        DB::transaction(function () use ($request, $page, $translations) {
            $page->update([
                'slug' => $request->slug,
                'footer_section' => $request->footer_section,
                'sort_order' => $request->input('sort_order') ?? 0,
                'is_active' => $request->boolean('is_active'),
            ]);

            foreach ($translations as $locale => $data) {
                PageTranslation::updateOrCreate(
                    ['page_id' => $page->id, 'locale' => $locale],
                    ['title' => $data['title'] ?? '', 'content' => $data['content'] ?? null]
                );
            }
        });

        Cache::forever('cache_ver_pages', microtime(true));

        return redirect()->route('admin.settings.pages.index')
            ->with('success', 'Page updated successfully.');
    }

    public function destroy(Page $page)
    {
        $page->delete();

        Cache::forever('cache_ver_pages', microtime(true));

        return redirect()->route('admin.settings.pages.index')
            ->with('success', 'Page deleted successfully.');
    }
}
