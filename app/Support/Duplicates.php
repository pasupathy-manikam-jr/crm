<?php

namespace App\Support;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * Finds records that are probably the same company or person: same email, same phone
 * (digits only, 7+), or the same normalised name. Works on what the current user can see.
 */
final class Duplicates
{
    public const TYPES = ['accounts', 'contacts', 'leads'];

    /**
     * Fields a merge can take from any of the records, per type.
     *
     * @var array<string, list<string>>
     */
    public const MERGEABLE = [
        'accounts' => ['name', 'industry', 'website', 'phone', 'email', 'billing_address', 'shipping_address'],
        'contacts' => ['first_name', 'last_name', 'job_title', 'email', 'phone', 'account_id'],
        'leads' => ['first_name', 'last_name', 'company', 'job_title', 'email', 'phone', 'source', 'status'],
    ];

    /**
     * @return class-string<Account|Contact|Lead>
     */
    public static function model(string $type): string
    {
        return match ($type) {
            'accounts' => Account::class,
            'contacts' => Contact::class,
            default => Lead::class,
        };
    }

    /**
     * Groups of two or more records that share any match key.
     *
     * ponytail: compares every visible record in PHP; fine to tens of thousands, move to
     * indexed normalised columns past that.
     *
     * @return array<int, Collection<int, Model>>
     */
    public static function groups(string $type): array
    {
        $records = self::model($type)::query()->with('owner:id,name')->get();
        $parent = [];
        $find = function (int $id) use (&$parent, &$find): int {
            return $parent[$id] === $id ? $id : ($parent[$id] = $find($parent[$id]));
        };
        $owner = [];

        foreach ($records as $record) {
            $parent[$record->getKey()] = $record->getKey();

            foreach (self::keys($record) as $key) {
                if (isset($owner[$key])) {
                    $parent[$find($record->getKey())] = $find($owner[$key]);
                } else {
                    $owner[$key] = $record->getKey();
                }
            }
        }

        /** @var array<int, Collection<int, Model>> $groups */
        $groups = $records->groupBy(fn (Model $r) => $find($r->getKey()))
            ->filter(fn (Collection $g) => $g->count() > 1)
            ->map(fn (Collection $g) => $g->sortBy('id')->values()->toBase())
            ->values()
            ->all();

        return $groups;
    }

    /**
     * Visible records that look like this one (excluding itself).
     *
     * @return Collection<int, Model>
     */
    public static function matching(Model $record): Collection
    {
        $keys = self::keys($record);

        return $keys === [] ? collect() : $record::query()->whereKeyNot($record->getKey())->get()
            ->filter(fn (Model $other) => array_intersect($keys, self::keys($other)) !== [])
            ->values();
    }

    /**
     * Match keys for a record: "e:<email>", "p:<digits>", "n:<normalised name>".
     *
     * @return list<string>
     */
    public static function keys(Model $record): array
    {
        $keys = [];
        $email = mb_strtolower(trim((string) $record->getAttribute('email')));
        $phone = preg_replace('/\D/', '', (string) $record->getAttribute('phone')) ?? '';
        $name = $record instanceof Account
            ? self::companyName((string) $record->getAttribute('name'))
            : self::squash($record->getAttribute('first_name').' '.$record->getAttribute('last_name'));

        if ($email !== '') {
            $keys[] = "e:{$email}";
        }
        if (strlen($phone) >= 7) {
            $keys[] = 'p:'.substr($phone, -9);
        }
        if (mb_strlen($name) >= 3) {
            $keys[] = "n:{$name}";
        }

        return $keys;
    }

    private static function companyName(string $name): string
    {
        $name = mb_strtolower($name);
        $name = preg_replace('/\b(sdn\.?\s*bhd|bhd|inc|ltd|llc|plc|co|company|corp|corporation|group|limited)\b\.?/u', ' ', $name) ?? $name;

        return self::squash($name);
    }

    private static function squash(string $text): string
    {
        return preg_replace('/[^a-z0-9]/', '', mb_strtolower($text)) ?? '';
    }
}
