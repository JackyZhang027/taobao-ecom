<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variant_option_assignments', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('option_id')
                ->references('id')
                ->on('product_variant_options')
                ->cascadeOnDelete();

            $table->primary(['product_variant_id', 'option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variant_option_assignments');
    }
};
