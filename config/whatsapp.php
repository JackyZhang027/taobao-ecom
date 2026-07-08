<?php

return [
    'base_url' => env('WHATSAPP_GATEWAY_URL', 'https://mpwa.smartappscare.com'),
    'api_key' => env('WHATSAPP_API_KEY'),
    'send_delay_seconds' => (int) env('WHATSAPP_SEND_DELAY_SECONDS', 5),
];
