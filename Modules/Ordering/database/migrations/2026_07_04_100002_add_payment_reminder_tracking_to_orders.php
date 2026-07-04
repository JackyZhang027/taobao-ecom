<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedTinyInteger('payment_reminder_count')->default(0)->after('status');
            $table->timestamp('last_payment_reminder_at')->nullable()->after('payment_reminder_count');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_reminder_count', 'last_payment_reminder_at']);
        });
    }
};
