<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\Page;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $page = Page::firstOrCreate(
            ['slug' => 'shipping-policy'],
            ['footer_section' => 'help', 'sort_order' => 0, 'is_active' => true]
        );

        $page->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Shipping Policy',
                'content' => <<<'HTML'
                    <h2>Processing Time</h2>
                    <p>Orders are processed and shipped within 1-3 business days after payment is confirmed. You will receive a notification once your order has been shipped.</p>
                    <h2>Shipping Rates &amp; Delivery Estimates</h2>
                    <ul>
                        <li>Domestic shipping typically takes 3-7 business days, depending on your location.</li>
                        <li>Shipping charges are calculated at checkout based on your delivery address and order weight.</li>
                    </ul>
                    <h2>Order Tracking</h2>
                    <p>Once your order ships, you can track its status from the Orders page in your account.</p>
                    <h2>Delays</h2>
                    <p>Occasionally, deliveries may be delayed due to courier issues, weather, or public holidays. We appreciate your patience in these situations.</p>
                    HTML,
            ]
        );

        $page->translations()->updateOrCreate(
            ['locale' => 'id'],
            [
                'title' => 'Kebijakan Pengiriman',
                'content' => <<<'HTML'
                    <h2>Waktu Proses</h2>
                    <p>Pesanan akan diproses dan dikirim dalam 1-3 hari kerja setelah pembayaran terkonfirmasi. Anda akan menerima notifikasi setelah pesanan dikirim.</p>
                    <h2>Biaya &amp; Estimasi Pengiriman</h2>
                    <ul>
                        <li>Pengiriman domestik biasanya memerlukan 3-7 hari kerja, tergantung lokasi Anda.</li>
                        <li>Biaya pengiriman dihitung saat checkout berdasarkan alamat tujuan dan berat pesanan.</li>
                    </ul>
                    <h2>Lacak Pesanan</h2>
                    <p>Setelah pesanan dikirim, Anda dapat melacak statusnya di halaman Pesanan pada akun Anda.</p>
                    <h2>Keterlambatan</h2>
                    <p>Sesekali pengiriman dapat tertunda karena masalah kurir, cuaca, atau hari libur nasional. Kami menghargai kesabaran Anda dalam situasi tersebut.</p>
                    HTML,
            ]
        );
    }
}
