<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ChangePasswordController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('auth/change-required-password');
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => $request->password,
            'must_change_password' => false,
        ]);

        return redirect()->route('shop.index')->with('status', 'Your password has been updated successfully.');
    }
}
