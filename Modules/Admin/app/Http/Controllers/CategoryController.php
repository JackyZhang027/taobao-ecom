<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Modules\Catalog\Models\Category;
use Yajra\DataTables\Facades\DataTables;

class CategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/categories/index');
    }

    public function datatable(): JsonResponse
    {
        $query = Category::with('parent')->select('categories.*');

        return DataTables::of($query)
            ->addColumn('parent_name', fn ($category) => $category->parent ? $category->parent->name : '—')
            ->addColumn('actions', fn ($category) => $category->id)
            ->make(true);
    }

    public function create()
    {
        $categories = Category::all();

        return Inertia::render('admin/categories/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_id' => 'nullable|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
            'parent_id' => 'nullable|exists:categories,id',
            'sort_order' => 'integer|min:0',
            'image' => 'nullable|image|max:10240',
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'name_id' => $validated['name_id'] ?? null,
            'slug' => $validated['slug'],
            'parent_id' => $validated['parent_id'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        if ($request->hasFile('image')) {
            $category->addMedia($request->file('image'))->toMediaCollection('image');
        }

        return redirect()->route('admin.categories.index');
    }

    /**
     * Recursively collect IDs of a category and all its descendants.
     */
    private function descendantIds(Category $category): array
    {
        $ids = [$category->id];
        foreach ($category->children as $child) {
            $ids = array_merge($ids, $this->descendantIds($child));
        }

        return $ids;
    }

    public function edit(Category $category)
    {
        $excludedIds = $this->descendantIds($category->load('children.children'));
        $categories = Category::whereNotIn('id', $excludedIds)->get();

        $media = $category->getFirstMedia('image');
        $image = $media ? [
            'id' => $media->id,
            'url' => parse_url($media->getUrl(), PHP_URL_PATH),
        ] : null;

        return Inertia::render('admin/categories/edit', [
            'category' => $category,
            'categories' => $categories,
            'image' => $image,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_id' => 'nullable|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id'),
                // Prevent circular hierarchy (self or any descendant)
                function ($attribute, $value, $fail) use ($category) {
                    if ($value && in_array((int) $value, $this->descendantIds($category->load('children.children')))) {
                        $fail('A category cannot have itself or one of its descendants as its parent.');
                    }
                },
            ],
            'sort_order' => 'integer|min:0',
            'image' => 'nullable|image|max:10240',
            'remove_image' => 'nullable|boolean',
        ]);

        $category->update([
            'name' => $validated['name'],
            'name_id' => $validated['name_id'] ?? null,
            'slug' => $validated['slug'],
            'parent_id' => $validated['parent_id'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        if ($request->remove_image) {
            $category->clearMediaCollection('image');
        }

        if ($request->hasFile('image')) {
            $category->addMedia($request->file('image'))->toMediaCollection('image');
        }

        return redirect()->route('admin.categories.index');
    }

    public function destroy(Category $category)
    {
        // Check if category has children
        if ($category->children()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete category because it has child categories. Please delete or reassign them first.']);
        }

        // Check if category has products
        if ($category->products()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete category because it is associated with products. Please remove the category from products first.']);
        }

        $category->delete();

        return redirect()->route('admin.categories.index');
    }
}
