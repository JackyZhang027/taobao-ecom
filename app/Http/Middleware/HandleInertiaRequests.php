<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Modules\Admin\Services\ShopSettingService;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $settings = app(ShopSettingService::class)->all();

        return [
            ...parent::share($request),
            'name' => $settings->get('shop_name') ?? config('app.name') ?? 'Shop',
            'auth' => [
                'user' => $user,
                'permissions' => fn () => $user ? $user->getAllPermissions()->pluck('name')->toArray() : [],
                'roles' => fn () => $user ? $user->getRoleNames()->toArray() : [],
            ],
            'sidebarOpen' => $request->hasCookie('sidebar_state') && $request->cookie('sidebar_state') === 'true',
            'cartCount' => $this->resolveCartCount($request),
            'wishlistCount' => $this->resolveWishlistCount($request),
            'exchangeRate' => app(\Modules\Currency\Services\CurrencyService::class)->getActiveRate(),
            'shopSettings' => $settings,
            'socialLinks' => fn () => \Illuminate\Support\Facades\Cache::remember(
                'social_links_active_'.(\Illuminate\Support\Facades\Cache::get('cache_ver_social_links', 0)),
                3600,
                fn () => \Modules\Admin\Models\SocialLink::active()->get(['id', 'name', 'icon', 'url'])
            ),
        ];
    }

    private function resolveCartCount(Request $request): int
    {
        try {
            $cartService = app(\Modules\Ordering\Services\CartService::class);
            $cart = $cartService->resolveCart($request);

            return (int) $cart->items()->sum('quantity');
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveWishlistCount(Request $request): int
    {
        try {
            $user = $request->user();
            if (! $user) {
                return 0;
            }

            return (int) \Modules\Catalog\Models\Wishlist::where('user_id', $user->id)->count();
        } catch (\Throwable) {
            return 0;
        }
    }
}
