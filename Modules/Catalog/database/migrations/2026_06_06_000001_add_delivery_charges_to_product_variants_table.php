<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('delivery_charge_batam', 10, 2)->default(0)->after('compare_price')->comment('In IDR');
            $table->decimal('delivery_charge_jakarta', 10, 2)->default(0)->after('delivery_charge_batam')->comment('In IDR');
        });

        DB::statement('
            UPDATE product_variants
            SET delivery_charge_batam = COALESCE(
                NULLIF((SELECT delivery_charge_batam FROM products WHERE products.id = product_variants.product_id), 0),
                (SELECT delivery_charge FROM products WHERE products.id = product_variants.product_id),
                0
            ),
            delivery_charge_jakarta = COALESCE(
                NULLIF((SELECT delivery_charge_jakarta FROM products WHERE products.id = product_variants.product_id), 0),
                (SELECT delivery_charge FROM products WHERE products.id = product_variants.product_id),
                0
            )
        ');
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['delivery_charge_batam', 'delivery_charge_jakarta']);
        });
    }
};
