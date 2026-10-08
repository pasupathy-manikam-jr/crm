<?php

namespace App\Actions\Crm;

use App\Models\Account;
use App\Models\Activity;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Note;
use App\Models\Quote;
use App\Models\SupportCase;
use App\Support\Duplicates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Merges duplicate records into one survivor: chosen field values are copied onto it,
 * everything linked to the others (activities, notes, files, contacts, deals, quotes, cases, contracts,
 * conversion links) moves to it, custom field values fill its gaps, then the others are
 * deleted. One transaction, so a failure changes nothing.
 */
class MergeRecords
{
    /**
     * @param  array<int, int>  $ids  All records in the merge, survivor included; each must be visible.
     * @param  array<string, int>  $values  field => id of the record whose value to keep.
     */
    public function __invoke(string $type, int $survivorId, array $ids, array $values): Model
    {
        return DB::transaction(function () use ($type, $survivorId, $ids, $values): Model {
            /** @var Collection<int, Model> $records */
            $records = Duplicates::model($type)::query()->whereKey($ids)->lockForUpdate()->get()->keyBy('id')->toBase();

            if ($records->count() !== count(array_unique($ids)) || ! $records->has($survivorId) || $records->count() < 2) {
                throw new LogicException(__('Choose two or more records you can see, including the one to keep.'));
            }

            if ($records->contains(fn (Model $r) => $r instanceof Lead && $r->isConverted())) {
                throw new LogicException(__('Converted leads can’t be merged.'));
            }

            /** @var Account|Contact|Lead $survivor */
            $survivor = $records[$survivorId];
            $others = $records->except([$survivorId]);
            $morph = $survivor->getMorphClass();

            foreach ($values as $field => $sourceId) {
                if (in_array($field, Duplicates::MERGEABLE[$type], true) && $records->has($sourceId)) {
                    $survivor->setAttribute($field, $records[$sourceId]->getAttribute($field));
                }
            }

            $custom = $survivor->custom_fields;
            foreach ($others as $other) {
                foreach ((array) $other->getAttribute('custom_fields') as $key => $value) {
                    if (($custom[$key] ?? null) === null && $value !== null) {
                        $custom[$key] = $value;
                    }
                }
            }
            $survivor->custom_fields = $custom;
            $survivor->save();

            $otherIds = $others->keys()->all();
            Activity::withoutGlobalScopes()->where('regarding_type', $morph)->whereIn('regarding_id', $otherIds)->update(['regarding_id' => $survivor->id]);
            Note::where('notable_type', $morph)->whereIn('notable_id', $otherIds)->update(['notable_id' => $survivor->id]);
            Attachment::where('attachable_type', $morph)->whereIn('attachable_id', $otherIds)->update(['attachable_id' => $survivor->id]);

            $column = match ($type) {
                'accounts' => 'account_id',
                'contacts' => 'contact_id',
                default => null,
            };

            if ($column !== null) {
                foreach ([Deal::class, Quote::class, SupportCase::class, Contract::class, ...($type === 'accounts' ? [Contact::class] : [])] as $model) {
                    $model::withoutGlobalScopes()->withTrashed()->whereIn($column, $otherIds)->update([$column => $survivor->id]);
                }
                Lead::withoutGlobalScopes()->withTrashed()->whereIn("converted_{$column}", $otherIds)->update(["converted_{$column}" => $survivor->id]);
            }

            foreach ($others as $other) {
                $other->delete();
            }

            AuditLog::create([
                'auditable_type' => $morph,
                'auditable_id' => $survivor->id,
                'event' => 'merged',
                'changes' => ['Merged in' => [null, $others->map(fn (Model $r) => $this->label($r))->implode(', ')]],
                'user_id' => Auth::id(),
            ]);

            return $survivor;
        });
    }

    private function label(Model $record): string
    {
        return $record instanceof Account ? $record->name : trim($record->getAttribute('first_name').' '.$record->getAttribute('last_name'));
    }
}
