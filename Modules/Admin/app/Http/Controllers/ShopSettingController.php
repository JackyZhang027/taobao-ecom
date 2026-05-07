<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Admin\Models\ShopSetting;

class ShopSettingController extends Controller
{
    private const ALLOWED_SETTING_KEYS = [
        'shop_name',
        'shop_email',
        'whatsapp_number',
        'address',
        'tagline',
        'footer_text',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    public function edit()
    {
        $settings = ShopSetting::all()->pluck('value', 'key');

        return Inertia::render('admin/settings/shop', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'nullable|array',
            'settings.*' => 'nullable|string|max:1000',
            'favicon' => 'nullable|image|max:2048',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->has('settings')) {
            foreach ($request->settings as $key => $value) {
                abort_if(! in_array($key, self::ALLOWED_SETTING_KEYS, true), 422, "Unknown setting key: {$key}");
                ShopSetting::set($key, $value);
            }
        }

        if ($request->hasFile('favicon')) {
            $path = $request->file('favicon')->store('settings', 'public');
            ShopSetting::set('favicon', \Illuminate\Support\Facades\Storage::url($path));
        }

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('settings', 'public');
            ShopSetting::set('logo', \Illuminate\Support\Facades\Storage::url($path));
        }

        Cache::forever('cache_ver_settings', microtime(true));

        // Return a response suitable for Inertia / Toast
        return redirect()->back();
    }
}
