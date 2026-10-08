<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * An IMAP mailbox the CRM reads (mail:sync): emails can open/continue cases and be turned
 * into draft quotes.
 *
 * @property int $id
 * @property string $name
 * @property string $host
 * @property int $port
 * @property string $encryption
 * @property string $username
 * @property string $password
 * @property string $folder
 * @property bool $create_cases
 * @property bool $draft_quotes
 * @property int $owner_id
 * @property string|null $allowed_domains
 * @property string|null $blocked_domains
 * @property bool $active
 * @property int|null $last_uid
 * @property CarbonInterface|null $last_synced_at
 * @property string|null $last_error
 */
#[Fillable(['name', 'host', 'port', 'encryption', 'username', 'password', 'folder', 'create_cases', 'draft_quotes', 'owner_id', 'allowed_domains', 'blocked_domains', 'active'])]
#[Hidden(['password'])]
class Mailbox extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'create_cases' => 'boolean',
            'draft_quotes' => 'boolean',
            'active' => 'boolean',
            'last_synced_at' => 'datetime',
        ];
    }

    /**
     * Whether mail from this address passes the allow/block lists (by domain, one per line).
     */
    public function accepts(string $email): bool
    {
        $domain = Str::lower(Str::after($email, '@'));
        $list = fn (?string $text): array => array_filter(array_map(fn (string $d): string => Str::lower(trim($d, " \t@")), preg_split('/[\s,]+/', (string) $text) ?: []));
        $allowed = $list($this->allowed_domains);

        return ! in_array($domain, $list($this->blocked_domains), true)
            && ($allowed === [] || in_array($domain, $allowed, true));
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return HasMany<InboundEmail, $this>
     */
    public function emails(): HasMany
    {
        return $this->hasMany(InboundEmail::class);
    }
}
