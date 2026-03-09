<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('street_address')->after('recipient_phone');
            $table->string('city')->after('street_address');
            $table->string('province')->nullable()->after('city');
            $table->string('postal_code', 10)->nullable()->after('province');
        });

        // Copy existing shipping_address data to street_address before dropping
        DB::table('orders')->update(['street_address' => DB::raw('shipping_address')]);

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('shipping_address');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->text('shipping_address')->after('recipient_phone');
        });

        DB::table('orders')->update(['shipping_address' => DB::raw('CONCAT(street_address, CASE WHEN city != \'\' THEN CONCAT(\', \', city) ELSE \'\' END)')]);

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['street_address', 'city', 'province', 'postal_code']);
        });
    }
};
