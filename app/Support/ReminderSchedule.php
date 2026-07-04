<?php

namespace App\Support;

final class ReminderSchedule
{
    public const MIN_MINUTES = 10;

    /**
     * @return array<int, int> Sorted, deduped list of minute thresholds.
     */
    public static function parseToMinutes(string $raw): array
    {
        $minutes = collect(explode(',', $raw))
            ->map(fn ($token) => trim($token))
            ->filter()
            ->map(fn (string $token) => self::parseToken($token, logOnFailure: true))
            ->filter(fn ($value) => $value !== null)
            ->unique()
            ->sort()
            ->values();

        return $minutes->all();
    }

    /**
     * Strict validator for admin-entered schedule strings: every token must
     * match a "<number><m|h|d>" duration and be at least MIN_MINUTES.
     */
    public static function isValidScheduleString(string $raw): bool
    {
        $tokens = collect(explode(',', $raw))
            ->map(fn ($token) => trim($token))
            ->filter();

        if ($tokens->isEmpty()) {
            return false;
        }

        return $tokens->every(fn (string $token) => self::parseToken($token, logOnFailure: false) !== null);
    }

    private static function parseToken(string $token, bool $logOnFailure): ?int
    {
        if (! preg_match('/^(\d+)\s*(m|h|d)$/i', $token, $matches)) {
            if ($logOnFailure) {
                \Log::warning('ReminderSchedule: skipping malformed threshold', ['token' => $token]);
            }

            return null;
        }

        $value = (int) $matches[1];
        $minutes = match (strtolower($matches[2])) {
            'm' => $value,
            'h' => $value * 60,
            'd' => $value * 60 * 24,
        };

        if ($minutes < self::MIN_MINUTES) {
            if ($logOnFailure) {
                \Log::warning('ReminderSchedule: skipping threshold below minimum', [
                    'token' => $token,
                    'minutes' => $minutes,
                ]);
            }

            return null;
        }

        return $minutes;
    }
}
