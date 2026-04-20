<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Admin\Models\ShopSetting;

class ShopSettingController extends Controller
{
    public function edit()
    {
        // Load all settings into a simple key => value array
        $settings = ShopSetting::all()->pluck('value', 'key');
        
        // Provide sane defaults if missing
        return Inertia::render('admin/settings/shop', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'nullable|array',
            'favicon' => 'nullable|image',
            'logo' => 'nullable|image',
        ]);

        if ($request->has('settings')) {
            foreach ($request->settings as $key => $value) {
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
