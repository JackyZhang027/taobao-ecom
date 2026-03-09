<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Modules\Catalog\Models\Wishlist;
use Yajra\DataTables\Facades\DataTables;

class WishlistController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/wishlists/index');
    }

    public function datatable(): JsonResponse
    {
        $query = Wishlist::with(['user', 'product.translations'])->select('wishlists.*');

        return DataTables::of($query)
            ->addColumn('user_name', fn ($w) => $w->user?->name ?? '—')
            ->addColumn('product_name', fn ($w) => $w->product?->translations->firstWhere('locale', 'en')?->name ?? $w->product?->slug ?? '—')
            ->addColumn('actions', fn ($w) => $w->id)
            ->make(true);
    }

    public function destroy(Wishlist $wishlist)
    {
        $wishlist->delete();

        return back();
    }
}
