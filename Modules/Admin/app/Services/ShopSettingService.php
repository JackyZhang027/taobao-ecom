<?php

namespace Modules\Admin\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Modules\Admin\Models\ShopSetting;

class ShopSettingService
{
    /**
     * Keys safe to expose to any visitor (shared Inertia props). Everything
     * else — WhatsApp sender/admin numbers, reminder templates/schedule — is
     * internal and must never leave the admin panel.
     */
    public const PUBLIC_KEYS = [
        'shop_name',
        'shop_email',
        'description',
        'contact_email',
        'contact_phone',
        'whatsapp_number',
        'address',
        'tagline',
        'footer_text',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'favicon',
        'logo',
    ];

    private ?Collection $cached = null;

    public function all(): Collection
    {
        if ($this->cached !== null) {
            return $this->cached;
        }

        $version = Cache::get('cache_ver_settings', 0);

        return $this->cached = Cache::remember("shop_settings_{$version}", 3600,
            fn () => ShopSetting::all()->pluck('value', 'key')
        );
    }

    /**
     * Only the settings safe to share with any visitor — see PUBLIC_KEYS.
     */
    public function public(): Collection
    {
        return $this->all()->only(self::PUBLIC_KEYS);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->all()->get($key, $default);
    }

    public function shopName(): string
    {
        return $this->get('shop_name') ?? config('app.name') ?? 'Shop';
    }
}
