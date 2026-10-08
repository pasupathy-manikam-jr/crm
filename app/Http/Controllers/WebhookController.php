<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\WebhookRequest;
use App\Jobs\SendWebhook;
use App\Models\Webhook;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class WebhookController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('webhooks/index', [
            // The secret is shown to admins so they can configure the receiver.
            'webhooks' => Webhook::orderBy('id')->get()->map(fn (Webhook $w): array => [...$w->toArray(), 'secret' => $w->secret]),
            'events' => Webhook::events(),
        ]);
    }

    public function store(WebhookRequest $request): RedirectResponse
    {
        Webhook::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Webhook added. Use Send test to check the receiver.')]);

        return back();
    }

    public function update(WebhookRequest $request, Webhook $webhook): RedirectResponse
    {
        $webhook->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Webhook saved.')]);

        return back();
    }

    public function destroy(Webhook $webhook): RedirectResponse
    {
        $webhook->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Webhook deleted.')]);

        return back();
    }

    /**
     * Send a "ping" now (not queued) and report how the receiver answered.
     */
    public function test(Webhook $webhook): RedirectResponse
    {
        try {
            SendWebhook::dispatchSync($webhook, ['event' => 'ping', 'occurred_at' => now()->toIso8601String(), 'data' => null]);
        } catch (Throwable) {
            // The outcome is recorded on the webhook either way.
        }

        $webhook->refresh();

        Inertia::flash('toast', $webhook->last_error === null
            ? ['type' => 'success', 'message' => __('Test delivered (HTTP :status).', ['status' => $webhook->last_status])]
            : ['type' => 'error', 'message' => __('Test failed: :error', ['error' => $webhook->last_error])]);

        return back();
    }
}
