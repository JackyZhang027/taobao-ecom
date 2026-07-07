<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Catalog\Models\Category;

class DummyProductSeeder extends Seeder
{
    private const TOTAL = 1000;

    private const CHUNK = 250;

    public function run(): void
    {
        $categoryIds = Category::pluck('id')->all();

        if (empty($categoryIds)) {
            $categoryIds = $this->createDefaultCategories();
        }

        $adjectives = ['Premium', 'Classic', 'Modern', 'Portable', 'Wireless', 'Foldable', 'Mini', 'Deluxe', 'Smart', 'Vintage', 'Ergonomic', 'Waterproof', 'Compact', 'Luxury', 'Casual'];
        $nouns = ['Backpack', 'Headphones', 'Sneakers', 'Watch', 'Jacket', 'Lamp', 'Keyboard', 'Mug', 'Sunglasses', 'Speaker', 'Wallet', 'T-Shirt', 'Power Bank', 'Water Bottle', 'Desk Organizer', 'Phone Case', 'Umbrella', 'Blanket', 'Tumbler', 'Storage Box'];
        $nounsId = ['Ransel', 'Headphone', 'Sepatu', 'Jam Tangan', 'Jaket', 'Lampu', 'Keyboard', 'Cangkir', 'Kacamata', 'Speaker', 'Dompet', 'Kaos', 'Power Bank', 'Botol Minum', 'Rak Meja', 'Casing HP', 'Payung', 'Selimut', 'Tumbler', 'Kotak Penyimpanan'];

        $now = now();
        $start = ((int) DB::table('products')->max('id')) + 1;

        for ($offset = 0; $offset < self::TOTAL; $offset += self::CHUNK) {
            $count = min(self::CHUNK, self::TOTAL - $offset);
            $products = [];
            $translations = [];
            $pivot = [];

            for ($i = 0; $i < $count; $i++) {
                $n = $start + $offset + $i;
                $adjective = $adjectives[array_rand($adjectives)];
                $nounIndex = array_rand($nouns);
                $nameEn = "{$adjective} {$nouns[$nounIndex]} {$n}";
                $nameId = "{$nounsId[$nounIndex]} {$adjective} {$n}";

                $products[] = [
                    'id' => $n,
                    'slug' => 'dummy-product-'.$n,
                    'thumbnail' => "https://picsum.photos/seed/product-{$n}/600/600",
                    'price' => mt_rand(500, 50000) / 100, // 5.00 – 500.00 CNY
                    'delivery_rate_batam' => mt_rand(0, 20) * 1000,
                    'delivery_rate_jakarta' => mt_rand(0, 30) * 1000,
                    'show_delivery_charge' => true,
                    'is_active' => true,
                    'sort_order' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $translations[] = [
                    'product_id' => $n,
                    'locale' => 'en',
                    'name' => $nameEn,
                    'description' => "<p>This is a dummy description for {$nameEn}. Great quality product sourced directly from Taobao at a competitive price.</p>",
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $translations[] = [
                    'product_id' => $n,
                    'locale' => 'id',
                    'name' => $nameId,
                    'description' => "<p>Ini adalah deskripsi dummy untuk {$nameId}. Produk berkualitas langsung dari Taobao dengan harga bersaing.</p>",
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $pivot[] = [
                    'product_id' => $n,
                    'category_id' => $categoryIds[array_rand($categoryIds)],
                ];
            }

            DB::transaction(function () use ($products, $translations, $pivot) {
                DB::table('products')->insert($products);
                DB::table('product_translations')->insert($translations);
                DB::table('category_product')->insert($pivot);
            });

            $this->command?->info('Seeded '.($offset + $count).'/'.self::TOTAL.' dummy products');
        }
    }

    /**
     * @return array<int, int>
     */
    private function createDefaultCategories(): array
    {
        $defaults = [
            ['name' => 'Electronics', 'name_id' => 'Elektronik', 'slug' => 'electronics'],
            ['name' => 'Fashion', 'name_id' => 'Fesyen', 'slug' => 'fashion'],
            ['name' => 'Home & Living', 'name_id' => 'Rumah Tangga', 'slug' => 'home-living'],
            ['name' => 'Accessories', 'name_id' => 'Aksesoris', 'slug' => 'accessories'],
        ];

        return array_map(
            fn (array $data) => Category::create($data)->id,
            $defaults
        );
    }
}
