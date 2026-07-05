<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\StoreFeature;

class StoreFeatureSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            [
                'sort_order' => 1,
                'icon' => 'Truck',
                'title' => 'Fast Delivery',
                'description' => 'Quick processing & nationwide shipping',
                'is_active' => true,
            ],
            [
                'sort_order' => 2,
                'icon' => 'ShieldCheck',
                'title' => 'Quality Guaranteed',
                'description' => 'Authentic products from trusted sellers',
                'is_active' => true,
            ],
            [
                'sort_order' => 3,
                'icon' => 'Lock',
                'title' => 'Secure Payment',
                'description' => '100% safe & protected transactions',
                'is_active' => true,
            ],
            [
                'sort_order' => 4,
                'icon' => 'Headphones',
                'title' => '24/7 Support',
                'description' => 'Always here to help you anytime',
                'is_active' => true,
            ],
        ];

        foreach ($features as $feature) {
            StoreFeature::firstOrCreate(
                ['sort_order' => $feature['sort_order']],
                $feature
            );
        }
    }
}
