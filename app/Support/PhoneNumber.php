<?php

namespace App\Support;

final class PhoneNumber
{
    public static function toWhatsAppFormat(string $raw): string
    {
        $digits = preg_replace('/\D+/', '', $raw) ?? '';

        if (str_starts_with($digits, '62')) {
            return $digits;
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        return '62'.$digits;
    }
}
