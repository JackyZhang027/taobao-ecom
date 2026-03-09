<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('delivery_charge_batam', 8, 2)->default(0)->after('delivery_charge')->comment('In RMB');
            $table->decimal('delivery_charge_jakarta', 8, 2)->default(0)->after('delivery_charge_batam')->comment('In RMB');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['delivery_charge_batam', 'delivery_charge_jakarta']);
        });
    }
};
