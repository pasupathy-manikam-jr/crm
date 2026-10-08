<?php

namespace App\Models;

use App\Http\Resources\RecordResource;
use App\Jobs\SendWebhook;
use App\Support\CrmRecords;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

/**
 * A URL told about record changes: each chosen event (<type>.<created|updated|deleted>)
 * is POSTed as signed JSON from the queue (see SendWebhook).
 *
 * @property int $id
 * @property string $url
 * @property list<string> $events
 * @property string $secret
 * @property bool $active
 * @property int|null $last_status
 * @property string|null $last_error
 * @property CarbonInterface|null $last_sent_at
 */
#[Fillable(['url', 'events', 'active'])]
#[Hidden(['secret'])]
class Webhook extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'events' => 'array',
            'secret' => 'encrypted',
            'active' => 'boolean',
            'last_sent_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Webhook $webhook): void {
            $webhook->secret ??= bin2hex(random_bytes(24));
        });
    }

    /**
     * Every event a webhook can subscribe to.
     *
     * @return list<string>
     */
    public static function events(): array
    {
        $events = [];

        foreach (array_keys(CrmRecords::TYPES) as $type) {
            foreach (['created', 'updated', 'deleted'] as $action) {
                $events[] = "{$type}.{$action}";
            }
        }

        return $events;
    }

    /**
     * Queue a delivery to every active webhook subscribed to this record event. The payload
     * is taken now, so it shows the record as it was saved.
     */
    public static function dispatchFor(Model $record, string $action): void
    {
        $event = $record->getMorphClass().'.'.$action;
        $webhooks = self::where('active', true)->whereJsonContains('events', $event)->get();

        if ($webhooks->isEmpty()) {
            return;
        }

        $payload = [
            'event' => $event,
            'occurred_at' => now()->toIso8601String(),
            'data' => (new RecordResource($record))->resolve(),
        ];

        foreach ($webhooks as $webhook) {
            SendWebhook::dispatch($webhook, $payload)->afterCommit();
        }
    }

    /**
     * http(s) URL whose host resolves only to public addresses, so a webhook can't be aimed
     * at the server itself or the private network. WEBHOOKS_ALLOW_PRIVATE=true lifts this
     * for local testing.
     *
     * ponytail: checked when saved and before each send, not pinned to the connection; a DNS
     * rebind between check and send is possible. Pin the IP if webhooks open to non-admins.
     */
    public static function isAllowedUrl(string $url): bool
    {
        $parts = parse_url($url);

        if (! in_array($parts['scheme'] ?? null, ['http', 'https'], true) || empty($parts['host'])) {
            return false;
        }

        if (config('app.webhooks_allow_private')) {
            return true;
        }

        $host = trim($parts['host'], '[]');
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);

        return $ips !== [] && collect($ips)->every(
            fn (string $ip): bool => filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false,
        );
    }
}
