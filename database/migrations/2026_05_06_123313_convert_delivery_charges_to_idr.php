<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Widen columns to handle IDR amounts before converting
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('delivery_charge', 12, 2)->change();
            $table->decimal('delivery_charge_batam', 12, 2)->change();
            $table->decimal('delivery_charge_jakarta', 12, 2)->change();
        });

        $rate = DB::table('exchange_rates')
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->value('rate');

        if (! $rate || $rate <= 0) {
            return;
        }

        DB::table('products')->update([
            'delivery_charge'         => DB::raw("ROUND(delivery_charge * {$rate}, 2)"),
            'delivery_charge_batam'   => DB::raw("ROUND(delivery_charge_batam * {$rate}, 2)"),
            'delivery_charge_jakarta' => DB::raw("ROUND(delivery_charge_jakarta * {$rate}, 2)"),
        ]);
    }

    public function down(): void
    {
        $rate = DB::table('exchange_rates')
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->value('rate');

        if ($rate && $rate > 0) {
            DB::table('products')->update([
                'delivery_charge'         => DB::raw("ROUND(delivery_charge / {$rate}, 4)"),
                'delivery_charge_batam'   => DB::raw("ROUND(delivery_charge_batam / {$rate}, 4)"),
                'delivery_charge_jakarta' => DB::raw("ROUND(delivery_charge_jakarta / {$rate}, 4)"),
            ]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('delivery_charge', 8, 4)->change();
            $table->decimal('delivery_charge_batam', 8, 4)->change();
            $table->decimal('delivery_charge_jakarta', 8, 4)->change();
        });
    }
};
