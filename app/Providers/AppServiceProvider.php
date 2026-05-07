<?php

namespace App\Providers;

use App\Listeners\MergeGuestCartOnLogin;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Attempting;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // Users with the 'admin' role bypass all permission Gate checks (super-admin).
        Gate::before(function (\App\Models\User $user, string $ability) {
            if ($user->hasRole('admin')) {
                return true;
            }
        });

        // Store the pre-login session ID so MergeGuestCartOnLogin can find the guest cart
        // after Laravel's SessionGuard regenerates the session ID on login.
        Event::listen(Attempting::class, function () {
            session(['_guest_cart_sid' => session()->getId()]);
        });

        Event::listen(Login::class, MergeGuestCartOnLogin::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
