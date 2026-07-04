<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Modules\Admin\Models\ShopSetting;

class WhatsAppService
{
    public function send(string $number, string $message): void
    {
        $response = Http::asForm()->post(config('whatsapp.base_url').'/send-message', [
            'api_key' => config('whatsapp.api_key'),
            'sender' => ShopSetting::get('whatsapp_sender'),
            'number' => $number,
            'message' => $message,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException("WhatsApp gateway request failed ({$response->status()}): {$response->body()}");
        }
    }

    public function generateQr(bool $force = false): array
    {
        return Http::asForm()->post(config('whatsapp.base_url').'/generate-qr', [
            'device' => ShopSetting::get('whatsapp_sender'),
            'api_key' => config('whatsapp.api_key'),
            'force' => $force,
        ])->json() ?? [];
    }

    public function logoutDevice(): array
    {
        return Http::asForm()->post(config('whatsapp.base_url').'/logout-device', [
            'sender' => ShopSetting::get('whatsapp_sender'),
            'api_key' => config('whatsapp.api_key'),
        ])->json() ?? [];
    }
}
