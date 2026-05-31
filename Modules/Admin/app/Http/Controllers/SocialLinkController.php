<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Admin\Http\Requests\StoreSocialLinkRequest;
use Modules\Admin\Http\Requests\UpdateSocialLinkRequest;
use Modules\Admin\Models\SocialLink;
use Yajra\DataTables\Facades\DataTables;

class SocialLinkController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/settings/social-links/index');
    }

    public function datatable()
    {
        $query = SocialLink::query();

        return DataTables::of($query)
            ->addColumn('status', fn ($link) => $link->is_active ? 'Active' : 'Inactive')
            ->addColumn('actions', fn ($link) => $link->id)
            ->make(true);
    }

    public function create()
    {
        return Inertia::render('admin/settings/social-links/create');
    }

    public function store(StoreSocialLinkRequest $request)
    {
        $data = $request->validated();
        $data['sort_order'] = $data['sort_order'] ?? 0;

        SocialLink::create($data);

        Cache::forever('cache_ver_social_links', microtime(true));

        return redirect()->route('admin.settings.social-links.index');
    }

    public function edit(SocialLink $socialLink)
    {
        return Inertia::render('admin/settings/social-links/edit', [
            'socialLink' => $socialLink,
        ]);
    }

    public function update(UpdateSocialLinkRequest $request, SocialLink $socialLink)
    {
        $data = $request->validated();
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $socialLink->update($data);

        Cache::forever('cache_ver_social_links', microtime(true));

        return redirect()->route('admin.settings.social-links.index');
    }

    public function destroy(SocialLink $socialLink)
    {
        $socialLink->delete();

        Cache::forever('cache_ver_social_links', microtime(true));

        return redirect()->route('admin.settings.social-links.index');
    }
}
