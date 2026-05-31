<?php

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('unverified user is redirected to verification notice when accessing checkout', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('checkout.index'))
        ->assertRedirect(route('verification.notice'));
});

test('unverified user is redirected to verification notice when accessing orders', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('orders.index'))
        ->assertRedirect(route('verification.notice'));
});

test('verified customer can access checkout page', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('customer');

    $this->actingAs($user)
        ->get(route('checkout.index'))
        ->assertOk();
});

test('customer is redirected to shop after verifying email', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $user = User::factory()->unverified()->create();
    $user->assignRole('customer');

    Event::fake();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)],
    );

    $this->actingAs($user)
        ->get($verificationUrl)
        ->assertRedirect('/shop?verified=1');

    Event::assertDispatched(Verified::class);
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});
