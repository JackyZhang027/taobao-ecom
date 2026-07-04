<?php

namespace Modules\Admin\Http\Controllers;

use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Modules\Admin\Models\ShopSetting;

class WhatsappSettingController extends Controller
{
    private const ALLOWED_SETTING_KEYS = [
        'whatsapp_sender',
        'whatsapp_admin_numbers',
    ];

    public function edit()
    {
        $settings = ShopSetting::whereIn('key', self::ALLOWED_SETTING_KEYS)->pluck('value', 'key');

        return Inertia::render('admin/settings/whatsapp', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'nullable|array',
            'settings.*' => 'nullable|string|max:1000',
        ]);

        if ($request->has('settings')) {
            foreach ($request->settings as $key => $value) {
                abort_if(! in_array($key, self::ALLOWED_SETTING_KEYS, true), 422, "Unknown setting key: {$key}");
                ShopSetting::set($key, $value);
            }
        }

        Cache::forever('cache_ver_settings', microtime(true));

        return redirect()->back();
    }

    public function generateQr(Request $request, WhatsAppService $whatsapp)
    {
        return response()->json($whatsapp->generateQr($request->boolean('force')));
    }

    public function logoutDevice(WhatsAppService $whatsapp)
    {
        return response()->json($whatsapp->logoutDevice());
    }
}
