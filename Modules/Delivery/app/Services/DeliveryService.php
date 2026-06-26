<?php

namespace Modules\Delivery\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Modules\Delivery\Models\DeliveryRate;

class DeliveryService
{
    private ?float $activeRateCache = null;

    public function getActiveRate(): float
    {
        return $this->activeRateCache ??= Cache::remember('delivery_rate_active', 300, function () {
            $rate = DeliveryRate::where('is_active', true)->latest()->first();

            return $rate?->rate ?? 0.0;
        });
    }

    public function calculateCharge(float $multiplier): float
    {
        return round($multiplier * $this->getActiveRate());
    }

    public function setRate(float $rate, int $adminId, ?string $notes = null): DeliveryRate
    {
        $deliveryRate = DB::transaction(function () use ($rate, $adminId, $notes) {
            DeliveryRate::where('is_active', true)->update(['is_active' => false]);

            return DeliveryRate::create([
                'rate' => $rate,
                'is_active' => true,
                'created_by' => $adminId,
                'notes' => $notes,
            ]);
        });

        $this->activeRateCache = null;
        Cache::forget('delivery_rate_active');

        return $deliveryRate;
    }
}
