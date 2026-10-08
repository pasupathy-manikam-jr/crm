<?php

namespace App\Support;

use App\Models\Account;
use App\Models\AuditLog;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\FieldDefinition;
use App\Models\Quote;
use App\Models\Stage;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * A record's audit log as people read it: newest first, field names as labels, and
 * linked ids (owner, stage, account, ...) shown by name.
 */
final class RecordHistory
{
    /**
     * Id columns shown by the linked record's name: model, and the column holding the name.
     *
     * @var array<string, array{0: class-string<Model>, 1: string}>
     */
    private const LINKS = [
        'owner_id' => [User::class, 'name'],
        'stage_id' => [Stage::class, 'name'],
        'account_id' => [Account::class, 'name'],
        'converted_account_id' => [Account::class, 'name'],
        'contact_id' => [Contact::class, 'last_name'],
        'converted_contact_id' => [Contact::class, 'last_name'],
        'converted_deal_id' => [Deal::class, 'name'],
        'renewal_deal_id' => [Deal::class, 'name'],
        'quote_id' => [Quote::class, 'number'],
    ];

    /**
     * @return array<int, array{id: int, event: string, at: string|null, user: string|null, changes: array<int, array{field: string, from: mixed, to: mixed}>}>
     */
    public static function for(Model $record, int $limit = 100): array
    {
        /** @var Collection<int, AuditLog> $logs */
        $logs = AuditLog::with('user:id,name')
            ->where('auditable_type', $record->getMorphClass())
            ->where('auditable_id', $record->getKey())
            ->latest('id')
            ->limit($limit)
            ->get();

        $names = self::names($logs);
        $labels = FieldDefinition::where('entity', $record->getMorphClass())->pluck('label', 'key')->all();

        return $logs->map(fn (AuditLog $log): array => [
            'id' => $log->id,
            'event' => $log->event,
            'at' => $log->created_at?->toIso8601String(),
            'user' => $log->user?->name,
            'changes' => in_array($log->event, ['updated', 'merged'], true)
                ? collect($log->changes ?? [])->map(fn (array $pair, string $field): array => [
                    'field' => str_starts_with($field, 'custom:')
                        ? ($labels[substr($field, 7)] ?? Str::headline(substr($field, 7)))
                        : __(Str::headline(Str::beforeLast($field, '_id'))),
                    'from' => self::display($field, $pair[0], $names),
                    'to' => self::display($field, $pair[1], $names),
                ])->values()->all()
                : [],
        ])->values()->all();
    }

    /**
     * One query per linked model for every id the logs mention.
     *
     * @param  Collection<int, AuditLog>  $logs
     * @return array<string, array<int, string>>
     */
    private static function names(Collection $logs): array
    {
        $ids = [];

        foreach ($logs as $log) {
            foreach ($log->changes ?? [] as $field => $pair) {
                if (isset(self::LINKS[$field])) {
                    $class = self::LINKS[$field][0];
                    $ids[$class] = [...($ids[$class] ?? []), ...array_filter($pair, 'is_numeric')];
                }
            }
        }

        $names = [];

        foreach ($ids as $class => $keys) {
            $column = collect(self::LINKS)->first(fn (array $link) => $link[0] === $class)[1];
            $query = $class::query()->withoutGlobalScopes();
            $names[$class] = $query->whereKey(array_unique($keys))->pluck($column, 'id')->all();
        }

        return $names;
    }

    /**
     * @param  array<string, array<int, string>>  $names
     */
    private static function display(string $field, mixed $value, array $names): mixed
    {
        if ($value === null || ! isset(self::LINKS[$field])) {
            return $value;
        }

        return $names[self::LINKS[$field][0]][(int) $value] ?? "#{$value}";
    }
}
