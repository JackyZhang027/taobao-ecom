<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\Faq;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'sort_order' => 1,
                'en' => [
                    'question' => 'How long does shipping take?',
                    'answer' => 'Orders are processed within 1-3 business days and typically arrive within 3-7 business days, depending on your location.',
                ],
                'id' => [
                    'question' => 'Berapa lama waktu pengiriman?',
                    'answer' => 'Pesanan diproses dalam 1-3 hari kerja dan biasanya tiba dalam 3-7 hari kerja, tergantung lokasi Anda.',
                ],
            ],
            [
                'sort_order' => 2,
                'en' => [
                    'question' => 'What payment methods do you accept?',
                    'answer' => 'We accept bank transfer, credit/debit cards, and e-wallets through our secure Midtrans payment gateway.',
                ],
                'id' => [
                    'question' => 'Metode pembayaran apa yang tersedia?',
                    'answer' => 'Kami menerima transfer bank, kartu kredit/debit, dan e-wallet melalui gateway pembayaran Midtrans yang aman.',
                ],
            ],
            [
                'sort_order' => 3,
                'en' => [
                    'question' => 'Can I track my order?',
                    'answer' => 'Yes, once your order ships you can track its status anytime from the Orders page in your account.',
                ],
                'id' => [
                    'question' => 'Bisakah saya melacak pesanan saya?',
                    'answer' => 'Ya, setelah pesanan dikirim Anda dapat melacak statusnya kapan saja di halaman Pesanan pada akun Anda.',
                ],
            ],
            [
                'sort_order' => 4,
                'en' => [
                    'question' => 'What is your return policy?',
                    'answer' => 'If an item arrives damaged or incorrect, contact our support team within 7 days of delivery to arrange a return or replacement.',
                ],
                'id' => [
                    'question' => 'Bagaimana kebijakan pengembalian barang?',
                    'answer' => 'Jika barang yang diterima rusak atau salah, hubungi tim dukungan kami dalam 7 hari setelah pengiriman untuk mengajukan pengembalian atau penggantian.',
                ],
            ],
        ];

        foreach ($faqs as $entry) {
            $faq = Faq::firstOrCreate(
                ['sort_order' => $entry['sort_order']],
                ['is_active' => true]
            );

            $faq->translations()->updateOrCreate(['locale' => 'en'], $entry['en']);
            $faq->translations()->updateOrCreate(['locale' => 'id'], $entry['id']);
        }
    }
}
