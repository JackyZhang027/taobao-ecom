<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variant_groups', function (Blueprint $table) {
            $table->boolean('has_images')->default(false)->after('sort_order');
        });
    }

    public function down(): void
    {
        Schema::table('product_variant_groups', function (Blueprint $table) {
            $table->dropColumn('has_images');
        });
    }
};
