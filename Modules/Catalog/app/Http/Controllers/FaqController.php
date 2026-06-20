<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Admin\Models\Faq;

class FaqController extends Controller
{
    public function index()
    {
        $faqs = Faq::with('translations')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Faq $faq) => [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
            ]);

        return Inertia::render('faq', [
            'faqs' => $faqs,
        ]);
    }
}
