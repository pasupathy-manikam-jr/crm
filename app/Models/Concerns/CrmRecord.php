<?php

namespace App\Models\Concerns;

use App\Models\Activity;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\FieldDefinition;
use App\Models\Note;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

/**
 * An account, contact, lead or deal: it carries activities, notes and files, and every
 * create, change and delete is written to its history (audit_logs) automatically.
 */
trait CrmRecord
{
    /**
     * Columns never written to history.
     *
     * @var list<string>
     */
    private static array $unaudited = ['id', 'created_at', 'updated_at', 'deleted_at'];

    public function initializeCrmRecord(): void
    {
        $this->mergeFillable(['custom_fields']);
    }

    /**
     * Admin-defined field values. Writing merges into what's stored, so a value for a field
     * that has since been deactivated (and so isn't in the form) is kept.
     *
     * @return Attribute<array<string, mixed>, array<string, mixed>|null>
     */
    protected function customFields(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): array => $value ? (array) json_decode($value, true) : [],
            set: function (?array $value): string {
                $current = isset($this->attributes['custom_fields']) ? (array) json_decode((string) $this->attributes['custom_fields'], true) : [];
                $fields = FieldDefinition::where('entity', $this->getMorphClass())->get()->keyBy('key');

                foreach ($value ?? [] as $key => $v) {
                    if ($fields->has($key)) {
                        $current[$key] = $fields[$key]->normalize($v);
                    }
                }

                return (string) json_encode($current);
            },
        );
    }

    public static function bootCrmRecord(): void
    {
        static::created(fn (Model $record) => self::audit($record, 'created', array_map(
            fn ($value) => [null, $value],
            array_diff_key($record->getAttributes(), array_flip(self::$unaudited)),
        )));

        static::updated(function (Model $record): void {
            $changes = [];

            foreach (array_diff_key($record->getChanges(), array_flip(self::$unaudited)) as $field => $new) {
                if ($field === 'custom_fields') {
                    // One history line per custom field that changed: "custom:<key>".
                    $before = (array) json_decode((string) $record->getRawOriginal('custom_fields'), true);
                    $after = (array) json_decode((string) $new, true);

                    foreach (array_keys($before + $after) as $key) {
                        if (($before[$key] ?? null) !== ($after[$key] ?? null)) {
                            $changes["custom:{$key}"] = [$before[$key] ?? null, $after[$key] ?? null];
                        }
                    }

                    continue;
                }

                $changes[$field] = [$record->getOriginal($field), $new];
            }

            if ($changes !== []) {
                self::audit($record, 'updated', $changes);
            }
        });

        static::deleted(fn (Model $record) => self::audit($record, 'deleted', null));
    }

    /**
     * @param  array<string, array{0: mixed, 1: mixed}>|null  $changes
     */
    private static function audit(Model $record, string $event, ?array $changes): void
    {
        AuditLog::create([
            'auditable_type' => $record->getMorphClass(),
            'auditable_id' => $record->getKey(),
            'event' => $event,
            'changes' => $changes === null ? null : array_map(
                fn (array $pair) => array_map(fn ($v) => $v instanceof \BackedEnum ? $v->value : ($v instanceof \DateTimeInterface ? $v->format('Y-m-d H:i:s') : $v), $pair),
                $changes,
            ),
            'user_id' => Auth::id(),
        ]);
    }

    /**
     * @return MorphMany<Activity, $this>
     */
    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'regarding');
    }

    /**
     * @return MorphMany<Note, $this>
     */
    public function notes(): MorphMany
    {
        return $this->morphMany(Note::class, 'notable');
    }

    /**
     * @return MorphMany<Attachment, $this>
     */
    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    /**
     * @return MorphMany<AuditLog, $this>
     */
    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
