<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_lines', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete()->after('order_id');
            $table->foreignId('product_variant_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('order_lines', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_id');
            $table->foreignId('product_variant_id')->nullable(false)->change();
        });
    }
};
