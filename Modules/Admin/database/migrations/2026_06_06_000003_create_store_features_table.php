<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_features', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('sort_order');
            $table->string('icon');
            $table->string('title');
            $table->string('description');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_features');
    }
};
