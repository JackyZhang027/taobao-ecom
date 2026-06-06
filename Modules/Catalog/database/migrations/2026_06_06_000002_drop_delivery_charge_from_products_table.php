<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('delivery_charge');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('delivery_charge', 8, 2)->default(0)->after('price')->comment('In IDR');
        });
    }
};
