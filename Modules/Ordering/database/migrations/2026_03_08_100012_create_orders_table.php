<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('pending');
            // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
            $table->decimal('subtotal_idr', 14, 2);
            $table->decimal('shipping_idr', 14, 2)->default(0);
            $table->decimal('grand_total_idr', 14, 2);
            $table->decimal('exchange_rate_snapshot', 10, 4);
            $table->string('recipient_name');
            $table->string('recipient_phone');
            $table->text('shipping_address');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
