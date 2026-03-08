<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
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
        $data = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($data['settings'] as $key => $value) {
            ShopSetting::set($key, $value);
        }

        // Return a response suitable for Inertia / Toast
        return redirect()->back();
    }
}
