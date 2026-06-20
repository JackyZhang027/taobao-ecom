<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Admin\Models\Page;

class PageController extends Controller
{
    public function show(string $slug)
    {
        $page = Page::with('translations')->where('slug', $slug)->where('is_active', true)->firstOrFail();

        return Inertia::render('page-show', [
            'page' => [
                'slug' => $page->slug,
                'title' => $page->title,
                'content' => $page->content,
            ],
        ]);
    }
}
