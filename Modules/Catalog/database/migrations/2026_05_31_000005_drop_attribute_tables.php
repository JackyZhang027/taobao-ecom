<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('product_variant_attribute_values');
        Schema::dropIfExists('attribute_values');
        Schema::dropIfExists('attribute_types');
    }

    public function down(): void
    {
        Schema::create('attribute_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_id')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_type_id')->constrained()->cascadeOnDelete();
            $table->string('value');
            $table->string('value_id')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('product_variant_attribute_values', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attribute_value_id')->constrained()->cascadeOnDelete();
            $table->primary(['product_variant_id', 'attribute_value_id']);
        });
    }
};
