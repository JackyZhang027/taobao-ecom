<?php

namespace Modules\Admin\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Modules\Admin\Models\ShopSetting;

class ShopSettingService
{
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

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->all()->get($key, $default);
    }

    public function shopName(): string
    {
        return $this->get('shop_name') ?? config('app.name') ?? 'Shop';
    }
}
