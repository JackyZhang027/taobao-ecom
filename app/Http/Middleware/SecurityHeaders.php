<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set(
            'Content-Security-Policy-Report-Only',
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' https://app.midtrans.com https://app.sandbox.midtrans.com; " .
            "style-src 'self' 'unsafe-inline'; " .
            "img-src 'self' data: blob: https:; " .
            "connect-src 'self'; " .
            "font-src 'self'; " .
            "frame-src https://app.midtrans.com https://app.sandbox.midtrans.com;"
        );
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        if (config('app.env') === 'production') {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
