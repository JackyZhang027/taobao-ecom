<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // The FK on order_id needs a supporting index at all times, so the
            // replacement plain index must be added before the unique one is dropped.
            $table->index('order_id', 'payments_order_id_index');
            $table->dropUnique(['order_id']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->unique('order_id');
            $table->dropIndex('payments_order_id_index');
        });
    }
};
