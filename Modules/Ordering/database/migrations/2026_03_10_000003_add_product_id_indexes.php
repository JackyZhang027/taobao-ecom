<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $cartIndexes = collect(Schema::getIndexes('cart_items'))->pluck('name');
        if (! $cartIndexes->contains('cart_items_product_id_index')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->index('product_id');
            });
        }

        $orderIndexes = collect(Schema::getIndexes('order_lines'))->pluck('name');
        if (! $orderIndexes->contains('order_lines_product_id_index')) {
            Schema::table('order_lines', function (Blueprint $table) {
                $table->index('product_id');
            });
        }
    }

    public function down(): void
    {
        // Indexes may be backing FK constraints — skip silent drop to avoid errors
    }
};
