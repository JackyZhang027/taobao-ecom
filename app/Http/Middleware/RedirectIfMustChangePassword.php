<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfMustChangePassword
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user &&
            $user->must_change_password &&
            $user->hasRole('customer') &&
            ! $request->routeIs('change-password.*', 'logout')
        ) {
            return redirect()->route('change-password.show');
        }

        return $next($request);
    }
}
