<?php

namespace App\Support;

final class MessageTemplate
{
    /**
     * Replace {token} placeholders in $template with values from $data.
     * Tokens with no matching key are left untouched.
     *
     * @param  array<string, string|int|float|null>  $data  keys without braces, e.g. ['order_no' => '123']
     */
    public static function render(string $template, array $data): string
    {
        $map = [];

        foreach ($data as $token => $value) {
            $map['{'.$token.'}'] = (string) ($value ?? '');
        }

        return strtr($template, $map);
    }
}
