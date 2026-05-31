<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'phone' => '1234567890',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('verification.notice'));
});

test('new users are unverified after registration', function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'phone' => '1234567890',
    ]);

    $user = User::where('email', 'test@example.com')->first();
    expect($user->hasVerifiedEmail())->toBeFalse();
});

test('registration sends email verification notification', function () {
    Notification::fake();

    $this->seed(\Database\Seeders\RoleSeeder::class);

    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'phone' => '1234567890',
    ]);

    $user = User::where('email', 'test@example.com')->first();
    Notification::assertSentTo($user, VerifyEmailNotification::class);
});
