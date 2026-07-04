<?php

use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Admin\Models\ShopSetting;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'whatsapp.base_url' => 'https://mpwa.smartappscare.com',
        'whatsapp.api_key' => 'test-api-key',
    ]);
    ShopSetting::set('whatsapp_sender', '62800000000');
});

test('checkNumber returns true when the gateway reports the number exists (documented "msg" shape)', function () {
    Http::fake(['*/check-number' => Http::response([
        'status' => true,
        'msg' => ['exists' => true, 'jid' => '628111111111@s.whatsapp.net'],
    ])]);

    expect(app(WhatsAppService::class)->checkNumber('628111111111'))->toBeTrue();
});

test('checkNumber returns true when the gateway reports the number exists (live "data" shape)', function () {
    Http::fake(['*/check-number' => Http::response([
        'status' => true,
        'data' => ['exists' => true, 'jid' => '628111111111@s.whatsapp.net'],
    ])]);

    expect(app(WhatsAppService::class)->checkNumber('628111111111'))->toBeTrue();
});

test('checkNumber returns false when the gateway reports the number does not exist', function () {
    Http::fake(['*/check-number' => Http::response([
        'status' => true,
        'msg' => ['exists' => false],
    ])]);

    expect(app(WhatsAppService::class)->checkNumber('628111111111'))->toBeFalse();
});

test('checkNumber returns false when the gateway request fails', function () {
    Http::fake(['*/check-number' => Http::response(null, 500)]);

    expect(app(WhatsAppService::class)->checkNumber('628111111111'))->toBeFalse();
});
