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

    public function checkNumber(string $number): bool
    {
        try {
            $response = Http::asForm()->post(config('whatsapp.base_url').'/check-number', [
                'api_key' => config('whatsapp.api_key'),
                'sender' => ShopSetting::get('whatsapp_sender'),
                'number' => $number,
            ]);

            if ($response->failed()) {
                \Log::warning('WhatsApp checkNumber: gateway request failed', [
                    'number' => $number,
                    'status' => $response->status(),
                ]);

                return false;
            }

            // The documented response nests the result under "msg", but the
            // live gateway actually nests it under "data" — support both.
            $exists = $response->json('data.exists') ?? $response->json('msg.exists');

            return (bool) $exists;
        } catch (\Throwable $e) {
            \Log::warning('WhatsApp checkNumber: exception', [
                'number' => $number,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function checkTimelock(): array
    {
        try {
            $response = Http::asForm()->post(config('whatsapp.base_url').'/check-timelock', [
                'api_key' => config('whatsapp.api_key'),
                'sender' => ShopSetting::get('whatsapp_sender'),
            ]);

            if ($response->failed()) {
                \Log::warning('WhatsApp checkTimelock: gateway request failed', [
                    'status' => $response->status(),
                ]);

                return ['is_active' => false];
            }

            return [
                'is_active' => (bool) $response->json('data.is_active'),
                'unlock_at' => $response->json('data.unlock_at'),
                'enforcement_type' => $response->json('data.enforcement_type'),
            ];
        } catch (\Throwable $e) {
            \Log::warning('WhatsApp checkTimelock: exception', [
                'error' => $e->getMessage(),
            ]);

            return ['is_active' => false];
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
