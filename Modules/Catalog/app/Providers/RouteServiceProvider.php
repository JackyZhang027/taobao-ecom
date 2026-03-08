<?php

namespace Modules\Catalog\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        parent::boot();
    }

    public function map(): void
    {
        // Routes loaded from routes/web.php and routes/admin.php for Wayfinder compatibility
    }
}
