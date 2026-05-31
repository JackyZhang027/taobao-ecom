<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $assignedIds = DB::table('product_variant_option_assignments')
            ->pluck('product_variant_id');

        $query = DB::table('product_variants');

        if ($assignedIds->isNotEmpty()) {
            $query->whereNotIn('id', $assignedIds);
        }

        $query->delete();
    }

    public function down(): void
    {
        // Deleted data cannot be restored.
    }
};
