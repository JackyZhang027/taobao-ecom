<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Catalog\Models\Category;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');

        $query = Category::with('media')
            ->whereNull('parent_id')
            ->orderBy('sort_order');

        if ($search) {
            $query->where(fn ($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_id', 'like', "%{$search}%")
            );
        }

        $categories = $query->get()->map(fn ($c) => [
            'id'        => $c->id,
            'name'      => $c->name,
            'name_id'   => $c->name_id,
            'slug'      => $c->slug,
            'image_url' => $c->getFirstMediaUrl('image', 'thumb') ?: $c->getFirstMediaUrl('image'),
        ])->all();

        return Inertia::render('categories/index', [
            'categories' => $categories,
            'search'     => $search,
        ]);
    }
}
