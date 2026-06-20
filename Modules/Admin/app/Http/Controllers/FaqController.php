<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Admin\Http\Requests\StoreFaqRequest;
use Modules\Admin\Http\Requests\UpdateFaqRequest;
use Modules\Admin\Models\Faq;
use Modules\Admin\Models\FaqTranslation;
use Yajra\DataTables\Facades\DataTables;

class FaqController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/settings/faqs/index');
    }

    public function datatable()
    {
        $query = Faq::with('translations');

        return DataTables::of($query)
            ->addColumn('question', fn (Faq $faq) => $faq->question)
            ->addColumn('status', fn (Faq $faq) => $faq->is_active ? 'Active' : 'Inactive')
            ->addColumn('actions', fn (Faq $faq) => $faq->id)
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/settings/faqs/create');
    }

    public function store(StoreFaqRequest $request)
    {
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['question']));

        DB::transaction(function () use ($request, $translations) {
            $faq = Faq::create([
                'sort_order' => $request->input('sort_order') ?? 0,
                'is_active' => $request->boolean('is_active'),
            ]);

            foreach ($translations as $locale => $data) {
                FaqTranslation::create([
                    'faq_id' => $faq->id,
                    'locale' => $locale,
                    'question' => $data['question'] ?? '',
                    'answer' => $data['answer'] ?? null,
                ]);
            }
        });

        return redirect()->route('admin.settings.faqs.index')
            ->with('success', 'FAQ created successfully.');
    }

    public function edit(Faq $faq)
    {
        $faq->load('translations');

        return Inertia::render('admin/settings/faqs/edit', [
            'faq' => [
                'id' => $faq->id,
                'sort_order' => $faq->sort_order,
                'is_active' => $faq->is_active,
                'translations' => $faq->translations->keyBy('locale')->map(fn ($t) => [
                    'question' => $t->question,
                    'answer' => $t->answer,
                ]),
            ],
        ]);
    }

    public function update(UpdateFaqRequest $request, Faq $faq)
    {
        $translations = array_filter($request->input('translations', []), fn ($t) => ! empty($t['question']));

        DB::transaction(function () use ($request, $faq, $translations) {
            $faq->update([
                'sort_order' => $request->input('sort_order') ?? 0,
                'is_active' => $request->boolean('is_active'),
            ]);

            foreach ($translations as $locale => $data) {
                FaqTranslation::updateOrCreate(
                    ['faq_id' => $faq->id, 'locale' => $locale],
                    ['question' => $data['question'] ?? '', 'answer' => $data['answer'] ?? null]
                );
            }
        });

        return redirect()->route('admin.settings.faqs.index')
            ->with('success', 'FAQ updated successfully.');
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return redirect()->route('admin.settings.faqs.index')
            ->with('success', 'FAQ deleted successfully.');
    }
}
