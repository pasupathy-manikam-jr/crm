<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Api\V1\RecordController;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

class ApiTokenController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('settings/api-tokens', [
            'tokens' => $request->user()->tokens()->latest('id')->get(['id', 'name', 'abilities', 'last_used_at', 'created_at']),
            'apiBase' => url('/api/v1'),
            'types' => array_keys(RecordController::TYPES),
        ]);
    }

    /**
     * Create a token; its text is flashed once (newToken) and never shown again.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'access' => ['required', Rule::in(['read', 'write'])],
        ]);

        $token = $request->user()->createToken(
            $validated['name'],
            $validated['access'] === 'write' ? ['read', 'write'] : ['read'],
        );

        Inertia::flash('newToken', $token->plainTextToken);

        return back();
    }

    public function destroy(Request $request, int $token): RedirectResponse
    {
        /** @var PersonalAccessToken $record */
        $record = $request->user()->tokens()->whereKey($token)->firstOrFail();
        $record->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Token “:name” revoked.', ['name' => $record->name])]);

        return back();
    }
}
