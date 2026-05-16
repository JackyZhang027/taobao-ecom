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
            $table->string('order_number', 30)->nullable()->unique()->after('id');
        });

        DB::table('orders')->orderBy('id')->each(function ($order) {
            $date = \Carbon\Carbon::parse($order->created_at)->format('Ymd');
            DB::table('orders')
                ->where('id', $order->id)
                ->update(['order_number' => sprintf('OR-%s-%05d', $date, $order->id)]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_number', 30)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['order_number']);
            $table->dropColumn('order_number');
        });
    }
};
