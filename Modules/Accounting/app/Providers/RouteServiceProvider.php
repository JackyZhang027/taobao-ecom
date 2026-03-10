<?php

namespace Modules\Accounting\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        parent::boot();
    }

    public function map(): void
    {
        // Routes loaded from routes/admin.php for Wayfinder compatibility
    }
}
