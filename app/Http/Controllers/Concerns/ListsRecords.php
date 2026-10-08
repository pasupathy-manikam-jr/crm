<?php

namespace App\Http\Controllers\Concerns;

use App\Enums\ActivityType;
use App\Enums\CustomFieldType;
use App\Http\Controllers\ActivityController;
use App\Models\Account;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\FieldDefinition;
use App\Models\Lead;
use App\Models\SupportCase;
use App\Support\CsvSchema;
use App\Support\Duplicates;
use App\Support\RecordHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

/**
 * The search, owner filter, sorting, paging and picker options every CRM list page shares.
 */
trait ListsRecords
{
    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @param  list<string>  $searchable  Columns the search box matches.
     * @param  list<string>  $sortable  Columns a header click may sort by; anything else falls back to the default.
     * @param  'asc'|'desc'  $defaultDirection
     * @return array{0: LengthAwarePaginator<int, TModel>, 1: array<string, string>}
     */
    protected function listRecords(Request $request, Builder $query, array $searchable, array $sortable, string $defaultSort, string $defaultDirection = 'asc'): array
    {
        $search = trim((string) $request->query('search'));
        $owner = (string) $request->query('owner');
        $custom = FieldDefinition::activeFor($query->getModel()->getMorphClass())->keyBy('key');
        $requested = (string) $request->query('sort');
        $customSort = str_starts_with($requested, 'custom:') ? $custom->get(substr($requested, 7)) : null;
        $sort = in_array($requested, $sortable, true) || $customSort !== null ? $requested : $defaultSort;
        $direction = in_array($request->query('direction'), ['asc', 'desc'], true) ? (string) $request->query('direction') : $defaultDirection;

        $records = $this->filterRecords($request, $query, $searchable)
            ->when($customSort === null, fn (Builder $q) => $q->orderBy($sort, $direction))
            // Numbers sort as numbers; text, dates (Y-m-d) and choices as text.
            ->when($customSort?->type === CustomFieldType::Number, fn (Builder $q) => $q->orderByRaw(
                "cast(json_unquote(json_extract(custom_fields, ?)) as decimal(20,4)) {$direction}",
                ['$."'.$customSort?->key.'"'],
            ))
            ->when($customSort !== null && $customSort->type !== CustomFieldType::Number, fn (Builder $q) => $q->orderBy("custom_fields->{$customSort?->key}", $direction))
            ->orderBy('id')
            ->paginate(25)
            ->withQueryString();

        $customFilters = $custom->mapWithKeys(fn (FieldDefinition $f): array => ["cf_{$f->key}" => (string) $request->query("cf_{$f->key}")])
            ->filter(fn (string $v): bool => $v !== '')->all();

        return [$records, [...compact('search', 'owner', 'sort', 'direction'), ...$customFilters]];
    }

    /**
     * The search box and owner filter, shared by list pages and CSV export.
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @param  list<string>  $searchable
     * @return Builder<TModel>
     */
    protected function filterRecords(Request $request, Builder $query, array $searchable): Builder
    {
        $search = trim((string) $request->query('search'));
        $owner = (string) $request->query('owner');

        return $query
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($searchable, $search): void {
                foreach ($searchable as $column) {
                    $query->orWhere($column, 'like', "%{$search}%");
                }
            }))
            ->when(ctype_digit($owner), fn (Builder $query) => $query->where('owner_id', (int) $owner))
            ->tap(fn (Builder $query) => $this->filterCustomFields($request, $query));
    }

    /**
     * cf_<key>=<value> filters on dropdown and yes/no custom fields (only active fields'
     * keys are read, so the JSON path never comes from the request).
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     */
    private function filterCustomFields(Request $request, Builder $query): void
    {
        foreach (FieldDefinition::activeFor($query->getModel()->getMorphClass()) as $field) {
            $value = (string) $request->query("cf_{$field->key}");

            if ($value === '') {
                continue;
            }

            match ($field->type) {
                CustomFieldType::Select => $query->where("custom_fields->{$field->key}", $value),
                CustomFieldType::Checkbox => $query->where("custom_fields->{$field->key}", $value === '1'),
                default => null,
            };
        }
    }

    /**
     * Owner choices for the list filter and the record forms.
     *
     * @return array<int, array{value: string, label: string}>
     */
    protected function ownerOptions(Request $request): array
    {
        return $request->user()->assignableOwners()
            ->map(fn ($user): array => ['value' => (string) $user->id, 'label' => $user->name])
            ->values()
            ->all();
    }

    /**
     * Accounts the user can see, for account pickers.
     *
     * ponytail: loads every visible account; switch to a search-as-you-type picker past a few thousand.
     *
     * @return array<int, array{value: string, label: string}>
     */
    protected function accountOptions(): array
    {
        return Account::orderBy('name')->get(['id', 'name'])
            ->map(fn (Account $account): array => ['value' => (string) $account->id, 'label' => $account->name])
            ->values()
            ->all();
    }

    /**
     * Contacts the user can see, with their account so a picker can narrow to one account.
     *
     * @return array<int, array{value: string, label: string, account_id: int|null}>
     */
    protected function contactOptions(): array
    {
        return Contact::orderBy('last_name')->get(['id', 'first_name', 'last_name', 'account_id'])
            ->map(fn (Contact $contact): array => ['value' => (string) $contact->id, 'label' => $contact->full_name, 'account_id' => $contact->account_id])
            ->values()
            ->all();
    }

    /**
     * Everything a record page's tabs show: activities (open first, soonest due), notes and
     * files (newest first) and its change history.
     *
     * @return array<string, mixed>
     */
    protected function recordTabProps(Account|Contact|Lead|Deal|SupportCase|Contract $record): array
    {
        $activities = $record->activities()->with('owner:id,name')
            ->orderByRaw('done_at is not null')
            ->orderByRaw('due_at is null')
            ->orderBy('due_at')
            ->latest('done_at')
            ->get()
            ->map(fn (Activity $a): array => ActivityController::present($a))
            ->values()
            ->all();

        return [
            'activities' => $activities,
            'activityTypes' => ActivityType::options(),
            'notes' => $record->notes()->with('author:id,name')->latest('id')->get(['id', 'body', 'user_id', 'created_at']),
            'attachments' => $record->attachments()->with('uploader:id,name')->latest('id')->get(['id', 'name', 'mime_type', 'size', 'user_id', 'created_at']),
            'history' => RecordHistory::for($record),
        ];
    }

    /**
     * Fields the CSV import dialog offers for a record type.
     *
     * @return list<array{value: string, label: string, required: bool}>
     */
    protected function csvFields(string $type): array
    {
        $fields = [];

        foreach (CsvSchema::fields($type) as $field => [$label, $rules]) {
            $fields[] = ['value' => $field, 'label' => __($label), 'required' => in_array('required', $rules, true)];
        }

        return $fields;
    }

    /**
     * "Added" toast after a create, or a warning naming what it looks like if a likely
     * duplicate already exists (Find duplicates can merge them).
     */
    protected function flashCreated(Account|Contact|Lead $record, string $label): void
    {
        $match = Duplicates::matching($record)->first();

        Inertia::flash('toast', $match === null
            ? ['type' => 'success', 'message' => __(':name added.', ['name' => $label])]
            : ['type' => 'warning', 'message' => __(':name added. It looks like “:match” already in your list; use Find duplicates to merge.', ['name' => $label, 'match' => $match instanceof Account ? $match->name : $match->getAttribute('full_name')])]);
    }
}
