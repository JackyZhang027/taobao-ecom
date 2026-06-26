<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('delivery_charge_batam', 'delivery_rate_batam');
            $table->renameColumn('delivery_charge_jakarta', 'delivery_rate_jakarta');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->renameColumn('delivery_charge_batam', 'delivery_rate_batam');
            $table->renameColumn('delivery_charge_jakarta', 'delivery_rate_jakarta');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('delivery_rate_batam', 'delivery_charge_batam');
            $table->renameColumn('delivery_rate_jakarta', 'delivery_charge_jakarta');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->renameColumn('delivery_rate_batam', 'delivery_charge_batam');
            $table->renameColumn('delivery_rate_jakarta', 'delivery_charge_jakarta');
        });
    }
};
