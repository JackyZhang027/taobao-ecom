<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_rates', function (Blueprint $table) {
            $table->id();
            $table->decimal('rate', 12, 2)->comment('IDR per 1 unit of delivery rate multiplier');
            $table->boolean('is_active')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Seed an initial active rate of 1 so that existing delivery_charge_* values
        // (renamed to delivery_rate_*) keep producing the exact same IDR amount
        // immediately after this refactor — multiplier × 1 == multiplier.
        DB::table('delivery_rates')->insert([
            'rate' => 1,
            'is_active' => true,
            'notes' => 'Initial rate — auto-seeded during delivery charge refactor',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_rates');
    }
};
