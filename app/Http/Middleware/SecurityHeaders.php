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
        $isDev = config('app.env') !== 'production';
        $viteOrigins = $isDev ? ' http://localhost:5173 http://127.0.0.1:5173 ws://localhost:5173 ws://127.0.0.1:5173' : '';

        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' https://app.midtrans.com https://app.sandbox.midtrans.com{$viteOrigins}; " .
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net; " .
            "img-src 'self' data: blob: https:; " .
            "connect-src 'self' https://fonts.bunny.net{$viteOrigins}; " .
            "font-src 'self' https://fonts.bunny.net; " .
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
