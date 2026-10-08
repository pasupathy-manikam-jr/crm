<?php

namespace App\Http\Controllers;

use App\Support\Locales;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    /**
     * Switch language: saved on the user when signed in, and in a year-long cookie so the
     * sign-in page remembers it too.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $locale = (string) $request->validate(['locale' => ['required', Rule::in(array_keys(Locales::SUPPORTED))]])['locale'];

        $request->user()?->update(['locale' => $locale]);

        return back()->withCookie(cookie()->forever('locale', $locale));
    }
}
