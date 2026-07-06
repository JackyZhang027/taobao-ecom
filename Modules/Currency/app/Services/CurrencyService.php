<?php

namespace Modules\Currency\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
        // Whole rupiah — IDR has no subunits, and Midtrans requires the order
        // gross_amount to exactly equal the sum of integer item prices.
        return round($rmb * $this->getActiveRate());
    }

    public function formatIdr(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }

    public function setRate(float $rate, int $adminId, ?string $notes = null): ExchangeRate
    {
        // Transactional so a failure after deactivating can never leave the
        // store with no active rate (which would zero out every price).
        $exchangeRate = DB::transaction(function () use ($rate, $adminId, $notes) {
            ExchangeRate::where('is_active', true)->update(['is_active' => false]);

            return ExchangeRate::create([
                'rate' => $rate,
                'is_active' => true,
                'created_by' => $adminId,
                'notes' => $notes,
            ]);
        });

        Cache::forget('exchange_rate_active');

        return $exchangeRate;
    }
}
