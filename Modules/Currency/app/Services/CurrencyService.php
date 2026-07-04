<?php

namespace Modules\Currency\Services;

use Illuminate\Support\Facades\Cache;
use Modules\Currency\Models\ExchangeRate;

class CurrencyService
{
    public function getActiveRate(): float
    {
        return Cache::remember('exchange_rate_active', 300, function () {
            $rate = ExchangeRate::where('is_active', true)->latest()->first();

            if ($rate === null) {
                \Illuminate\Support\Facades\Log::error(
                    'CurrencyService: no active exchange rate configured — storefront prices will display as 0'
                );
            }

            return $rate?->rate ?? 0.0;
        });
    }

    public function rmbToIdr(float $rmb): float
    {
        return round($rmb * $this->getActiveRate(), 2);
    }

    public function formatIdr(float $amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    public function setRate(float $rate, int $adminId, ?string $notes = null): ExchangeRate
    {
        ExchangeRate::where('is_active', true)->update(['is_active' => false]);

        $exchangeRate = ExchangeRate::create([
            'rate' => $rate,
            'is_active' => true,
            'created_by' => $adminId,
            'notes' => $notes,
        ]);

        Cache::forget('exchange_rate_active');

        return $exchangeRate;
    }
}
