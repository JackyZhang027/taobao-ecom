<?php

namespace Modules\Payment\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Modules\Payment\Services\PaymentService;

class WebhookController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function handle(Request $request): Response
    {
        $payload = $request->all();
        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';
        $serverKey = config('midtrans.server_key');

        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        if (! hash_equals($expectedSignature, $payload['signature_key'] ?? '')) {
            abort(403, 'Invalid signature');
        }

        $this->paymentService->handleWebhook($payload);

        return response('OK', 200);
    }
}
