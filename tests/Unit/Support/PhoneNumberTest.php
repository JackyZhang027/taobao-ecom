<?php

use App\Support\PhoneNumber;

test('it normalizes phone numbers to the whatsapp international format', function (string $raw, string $expected) {
    expect(PhoneNumber::toWhatsAppFormat($raw))->toBe($expected);
})->with([
    ['0812345678', '62812345678'],
    ['+62812345678', '62812345678'],
    ['62812345678', '62812345678'],
    ['812345678', '62812345678'],
    ['0812-345-678', '62812345678'],
]);
