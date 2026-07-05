<?php

use App\Support\MessageTemplate;

test('it substitutes placeholders with matching data', function () {
    $result = MessageTemplate::render('Order #{order_no} for {customer_name}', [
        'order_no' => '123',
        'customer_name' => 'Jacky',
    ]);

    expect($result)->toBe('Order #123 for Jacky');
});

test('it leaves unknown placeholders untouched', function () {
    $result = MessageTemplate::render('Hi {customer_name}, code {not_a_real_token}', [
        'customer_name' => 'Jacky',
    ]);

    expect($result)->toBe('Hi Jacky, code {not_a_real_token}');
});

test('it renders a null value as an empty string', function () {
    $result = MessageTemplate::render('Phone: {customer_phone}', [
        'customer_phone' => null,
    ]);

    expect($result)->toBe('Phone: ');
});

test('it substitutes every occurrence of a repeated token', function () {
    $result = MessageTemplate::render('{order_no} - {order_no}', [
        'order_no' => '123',
    ]);

    expect($result)->toBe('123 - 123');
});
