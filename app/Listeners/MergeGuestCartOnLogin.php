<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Modules\Ordering\Services\CartService;

class MergeGuestCartOnLogin
{
    public function __construct(private CartService $cartService) {}

    public function handle(Login $event): void
    {
        $sessionId = session()->getId();

        if ($sessionId) {
            $this->cartService->mergeGuestCart($event->user, $sessionId);
        }
    }
}
