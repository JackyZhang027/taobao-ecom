<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $token) {}

    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $shopName = app(\Modules\Admin\Services\ShopSettingService::class)->shopName();

        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage)
            ->subject("Reset Your Password - {$shopName}")
            ->greeting('Hello!')
            ->line("You are receiving this email because we received a password reset request for your account at {$shopName}.")
            ->action('Reset Password', $url)
            ->line('This password reset link will expire in '.config('auth.passwords.'.config('fortify.passwords', 'users').'.expire').' minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}
