<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The unique index (cart_id, product_variant_id) may be the only index covering
        // the cart_id FK. Add a standalone cart_id index first so MySQL allows dropping it.
        $hasSingleCartIdIndex = !empty(DB::select(
            "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items'
             AND INDEX_NAME = 'cart_items_cart_id_index'"
        ));
        if (!$hasSingleCartIdIndex) {
            DB::statement('ALTER TABLE cart_items ADD INDEX cart_items_cart_id_index (cart_id)');
        }

        // Drop the unique index now that cart_id has its own index
        $hasUniqueIndex = !empty(DB::select(
            "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items'
             AND INDEX_NAME = 'cart_items_cart_id_product_variant_id_unique'"
        ));
        if ($hasUniqueIndex) {
            DB::statement('ALTER TABLE cart_items DROP INDEX cart_items_cart_id_product_variant_id_unique');
        }

        // Drop FK on product_variant_id if exists
        $hasFk = !empty(DB::select(
            "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'cart_items_product_variant_id_foreign'"
        ));
        if ($hasFk) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropForeign(['product_variant_id']);
            });
        }

        // Make product_variant_id nullable
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->nullable()->change();
        });

        // Add product_id column if not present
        if (!Schema::hasColumn('cart_items', 'product_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete()->after('cart_id');
            });
        }

        // Add FK for product_variant_id if not present
        $hasFkNow = !empty(DB::select(
            "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'cart_items_product_variant_id_foreign'"
        ));
        if (!$hasFkNow) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->foreign('product_variant_id')->references('id')->on('product_variants')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropForeign(['product_variant_id']);
            $table->dropConstrainedForeignId('product_id');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->nullable(false)->change();
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropForeign(['cart_id']);
        });

        DB::statement('ALTER TABLE cart_items DROP INDEX cart_items_cart_id_index');

        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();
            $table->unique(['cart_id', 'product_variant_id']);
            $table->foreign('cart_id')->references('id')->on('carts')->cascadeOnDelete();
        });
    }
};
