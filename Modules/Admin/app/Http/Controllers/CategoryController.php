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

    public function edit(Category $category)
    {
        // Get all categories EXCEPT the current one and its descendants (to prevent cyclic parent assignment)
        // For simplicity, we just exclude the current category itself, but ideally we'd exclude descendants too.
        $categories = Category::where('id', '!=', $category->id)->get();

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
                // Prevent category from being its own parent
                function ($attribute, $value, $fail) use ($category) {
                    if ($value == $category->id) {
                        $fail('A category cannot be its own parent.');
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
