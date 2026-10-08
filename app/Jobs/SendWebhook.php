<?php

namespace App\Jobs;

use App\Models\Webhook;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * POST one event to one webhook: JSON body, X-OricCRM-Event, and X-OricCRM-Signature
 * ("sha256=" + HMAC-SHA256 of the body with the webhook's secret). Non-2xx answers retry
 * twice (after 1 and 5 minutes); the outcome is kept on the webhook.
 */
class SendWebhook implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [60, 300];

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(public Webhook $webhook, public array $payload) {}

    public function handle(): void
    {
        if (! Webhook::isAllowedUrl($this->webhook->url)) {
            $this->record(null, 'The URL points at a private or local address, so it was not called.');

            return;
        }

        $body = (string) json_encode($this->payload);

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-OricCRM-Event' => (string) $this->payload['event'],
                    'X-OricCRM-Signature' => 'sha256='.hash_hmac('sha256', $body, $this->webhook->secret),
                    'User-Agent' => 'OricCRM-Webhook/1',
                ])
                ->withBody($body, 'application/json')
                ->withoutRedirecting()
                ->post($this->webhook->url);
        } catch (Throwable $e) {
            $this->record(null, $e->getMessage());

            throw $e;
        }

        $this->record($response->status(), $response->successful() ? null : "HTTP {$response->status()}");

        if (! $response->successful()) {
            throw new RuntimeException("Webhook {$this->webhook->id} answered HTTP {$response->status()}.");
        }
    }

    private function record(?int $status, ?string $error): void
    {
        $this->webhook->forceFill([
            'last_status' => $status,
            'last_error' => $error === null ? null : mb_substr($error, 0, 500),
            'last_sent_at' => now(),
        ])->saveQuietly();
    }
}
