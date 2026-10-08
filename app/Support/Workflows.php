<?php

namespace App\Support;

use App\Enums\ActivityType;
use App\Enums\CasePriority;
use App\Enums\CaseStatus;
use App\Enums\ContractStatus;
use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Enums\QuoteStatus;
use App\Models\Activity;
use App\Models\Quote;
use App\Models\Stage;
use App\Models\User;
use App\Models\WorkflowRule;
use App\Notifications\QuoteApproval;
use BackedEnum;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Throwable;

/**
 * Workflow rules: what they can watch, test and do, and the engine that runs them after a
 * record is saved. Rules run once the save's transaction commits, so a quote is judged on
 * its final totals, and actions never re-trigger rules.
 *
 * ponytail: runs in the request after commit, not on the queue; move run() into a queued job
 * if rules start sending many emails.
 */
final class Workflows
{
    /**
     * @var array<string, string>
     */
    public const EVENTS = [
        'created' => 'is created',
        'updated' => 'is updated',
        'saved' => 'is created or updated',
    ];

    /**
     * @var array<string, string>
     */
    public const OPERATORS = [
        'equals' => 'is',
        'not_equals' => 'is not',
        'greater_than' => 'is more than',
        'less_than' => 'is less than',
        'contains' => 'contains',
        'is_empty' => 'is empty',
        'is_not_empty' => 'is not empty',
        'changed' => 'changed',
    ];

    /** Operators that take no value. */
    public const UNARY = ['is_empty', 'is_not_empty', 'changed'];

    private static bool $running = false;

    /**
     * Saves waiting for their transaction to commit, one entry per record.
     *
     * @var array<string, array{model: Model, event: string, changed: list<string>}>
     */
    private static array $pending = [];

    /**
     * @return array<string, class-string<Model>>
     */
    public static function models(): array
    {
        return [...CrmRecords::TYPES, 'quote' => Quote::class];
    }

    /**
     * Every module's fields (for conditions and Set field) and the actions it allows, as the
     * rule editor and validation need them.
     *
     * @return array<string, array{label: string, fields: list<array{key: string, label: string, type: string, options?: list<array{value: string, label: string}>, settable: bool}>, actions: list<string>}>
     */
    public static function definitions(): array
    {
        $text = self::textField(...);
        $select = self::selectField(...);
        $owner = $select('owner_id', __('Owner'), array_values(User::orderBy('name')->get(['id', 'name'])
            ->map(fn (User $u): array => ['value' => (string) $u->id, 'label' => $u->name])->values()->all()));
        $record = ['set_field', 'create_task', 'send_email'];

        return [
            'lead' => ['label' => __('Lead'), 'actions' => $record, 'fields' => [
                $text('first_name', __('First name')), $text('last_name', __('Last name')), $text('company', __('Company')),
                $text('job_title', __('Job title')), $text('email', __('Email')), $text('phone', __('Phone')),
                $select('source', __('Source'), LeadSource::options()),
                $select('status', __('Status'), array_values(array_filter(LeadStatus::options(), fn (array $o): bool => $o['value'] !== LeadStatus::Converted->value))),
                $owner,
            ]],
            'contact' => ['label' => __('Contact'), 'actions' => $record, 'fields' => [
                $text('first_name', __('First name')), $text('last_name', __('Last name')), $text('job_title', __('Job title')),
                $text('email', __('Email')), $text('phone', __('Phone')), $owner,
            ]],
            'account' => ['label' => __('Account'), 'actions' => $record, 'fields' => [
                $text('name', __('Name')), $text('industry', __('Industry')), $text('email', __('Email')),
                $text('phone', __('Phone')), $text('website', __('Website')), $owner,
            ]],
            'deal' => ['label' => __('Deal'), 'actions' => $record, 'fields' => [
                $text('name', __('Name')),
                ['key' => 'amount', 'label' => __('Amount'), 'type' => 'number', 'settable' => true],
                ['key' => 'probability', 'label' => __('Probability %'), 'type' => 'number', 'settable' => true],
                $select('stage_id', __('Stage'), array_values(Stage::orderBy('position')->get(['id', 'name'])
                    ->map(fn (Stage $s): array => ['value' => (string) $s->id, 'label' => $s->name])->values()->all())),
                ['key' => 'expected_close_date', 'label' => __('Expected close'), 'type' => 'date', 'settable' => true],
                $owner,
            ]],
            'case' => ['label' => __('Case'), 'actions' => $record, 'fields' => [
                $text('subject', __('Subject')),
                $select('priority', __('Priority'), CasePriority::options()),
                $select('status', __('Status'), CaseStatus::options()),
                $owner,
            ]],
            'contract' => ['label' => __('Contract'), 'actions' => $record, 'fields' => [
                $text('name', __('Name')),
                $select('status', __('Status'), ContractStatus::options()),
                ['key' => 'value', 'label' => __('Value'), 'type' => 'number', 'settable' => true],
                ['key' => 'start_date', 'label' => __('Start date'), 'type' => 'date', 'settable' => true],
                ['key' => 'end_date', 'label' => __('End date'), 'type' => 'date', 'settable' => true],
                $owner,
            ]],
            // Quote totals come from its lines and its status from its own buttons, so rules only read them.
            'quote' => ['label' => __('Quote'), 'actions' => ['set_field', 'send_email', 'require_approval'], 'fields' => [
                ['key' => 'total', 'label' => __('Total'), 'type' => 'number', 'settable' => false],
                ['key' => 'subtotal', 'label' => __('Subtotal'), 'type' => 'number', 'settable' => false],
                ['key' => 'discount_total', 'label' => __('Discount amount'), 'type' => 'number', 'settable' => false],
                ['key' => 'discount_percent', 'label' => __('Discount %'), 'type' => 'number', 'settable' => false],
                $select('status', __('Status'), QuoteStatus::options(), settable: false),
                $owner,
            ]],
        ];
    }

    /**
     * @return array{key: string, label: string, type: string, settable: bool}
     */
    private static function textField(string $key, string $label): array
    {
        return ['key' => $key, 'label' => $label, 'type' => 'text', 'settable' => true];
    }

    /**
     * @param  list<array{value: string, label: string}>  $options
     * @return array{key: string, label: string, type: string, options: list<array{value: string, label: string}>, settable: bool}
     */
    private static function selectField(string $key, string $label, array $options, bool $settable = true): array
    {
        return ['key' => $key, 'label' => $label, 'type' => 'select', 'options' => $options, 'settable' => $settable];
    }

    /**
     * Called from model events: runs matching rules once the surrounding transaction commits
     * (straight away outside one). Several saves of one record in a transaction count as one,
     * as "created" if any was the create.
     *
     * ponytail: a rolled-back transaction leaves its entry behind, so that record's rules skip
     * until the process ends; fine for web requests, revisit for long-running workers.
     */
    public static function queue(Model $model, string $event): void
    {
        if (self::$running) {
            return;
        }

        $key = $model::class.':'.$model->getKey();
        $changed = $event === 'updated' ? array_keys($model->getChanges()) : [];

        if (isset(self::$pending[$key])) {
            self::$pending[$key]['changed'] = array_values(array_unique([...self::$pending[$key]['changed'], ...$changed]));

            return;
        }

        self::$pending[$key] = ['model' => $model, 'event' => $event, 'changed' => $changed];

        DB::afterCommit(function () use ($key): void {
            $pending = self::$pending[$key] ?? null;
            unset(self::$pending[$key]);

            if ($pending !== null) {
                self::run($pending['model'], $pending['event'], $pending['changed']);
            }
        });
    }

    /**
     * @param  list<string>  $changed  Columns the update changed, for the "changed" operator.
     */
    public static function run(Model $model, string $event, array $changed = []): void
    {
        $module = array_search($model::class, self::models(), true);

        if ($module === false) {
            return;
        }

        $rules = WorkflowRule::where('module', $module)->where('active', true)
            ->whereIn('event', [$event, 'saved'])->orderBy('id')->get();

        self::$running = true;

        try {
            foreach ($rules as $rule) {
                if (! self::matches($rule->conditions, $model, $event, $changed)) {
                    continue;
                }

                foreach ($rule->actions as $action) {
                    // One failing action (say, a bounced email) mustn't undo the user's save or the other actions.
                    try {
                        self::perform($action, $model);
                    } catch (Throwable $e) {
                        report($e);
                    }
                }

                $rule->increment('runs_count');
            }
        } finally {
            self::$running = false;
        }
    }

    /**
     * @param  list<array{field: string, operator: string, value?: string|null}>  $conditions
     * @param  list<string>  $changed
     */
    public static function matches(array $conditions, Model $model, string $event, array $changed): bool
    {
        foreach ($conditions as $condition) {
            $value = self::value($model, $condition['field']);
            $expected = trim((string) ($condition['value'] ?? ''));

            $holds = match ($condition['operator']) {
                'equals' => strcasecmp((string) $value, $expected) === 0,
                'not_equals' => strcasecmp((string) $value, $expected) !== 0,
                'greater_than' => $value !== null && self::compare($value, $expected) > 0,
                'less_than' => $value !== null && self::compare($value, $expected) < 0,
                'contains' => $expected !== '' && stripos((string) $value, $expected) !== false,
                'is_empty' => $value === null || $value === '',
                'is_not_empty' => $value !== null && $value !== '',
                'changed' => $event === 'created' || in_array($condition['field'], $changed, true),
                default => false,
            };

            if (! $holds) {
                return false;
            }
        }

        return true;
    }

    /**
     * Numbers compare as numbers; anything else (dates are Y-m-d) as text.
     */
    private static function compare(string $value, string $expected): int
    {
        return is_numeric($value) && is_numeric($expected)
            ? (float) $value <=> (float) $expected
            : strcmp($value, $expected);
    }

    /**
     * A field's value as text: enums by value, dates as Y-m-d.
     */
    private static function value(Model $model, string $field): ?string
    {
        $value = $model->getAttribute($field);

        return match (true) {
            $value instanceof BackedEnum => (string) $value->value,
            $value instanceof CarbonInterface => $value->toDateString(),
            is_bool($value) => $value ? '1' : '0',
            is_scalar($value) => (string) $value,
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $action
     */
    private static function perform(array $action, Model $model): void
    {
        match ($action['type'] ?? null) {
            'set_field' => self::setField($model, (string) $action['field'], $action['value'] ?? null),
            'create_task' => Activity::create([
                'type' => ActivityType::Task,
                'subject' => self::fill((string) $action['subject'], $model),
                'due_at' => isset($action['due_in_days']) && $action['due_in_days'] !== '' ? today()->addDays((int) $action['due_in_days'])->setTime(9, 0) : null,
                'owner_id' => $model->getAttribute('owner_id'),
                'regarding_type' => $model->getMorphClass(),
                'regarding_id' => $model->getKey(),
            ]),
            'send_email' => self::sendEmail($model, (string) $action['to'], (string) $action['subject'], (string) $action['body']),
            'require_approval' => $model instanceof Quote ? self::requireApproval($model) : null,
            default => null,
        };
    }

    private static function setField(Model $model, string $field, mixed $value): void
    {
        $model->setAttribute($field, $value === '' ? null : $value);
        $model->save();
    }

    private static function sendEmail(Model $model, string $to, string $subject, string $body): void
    {
        $address = match ($to) {
            'owner' => $model->getRelationValue('owner')?->getAttribute('email'),
            'record' => $model->getAttribute('email') ?? (method_exists($model, 'contact') ? $model->getRelationValue('contact')?->getAttribute('email') : null),
            default => $to,
        };

        if (! is_string($address) || $address === '') {
            return;
        }

        Mail::raw(self::fill($body, $model), fn (Message $message) => $message->to($address)->subject(self::fill($subject, $model)));
    }

    /**
     * Lock a draft quote until a manager decides. A quote that already has a decision is
     * left alone until it is edited (editing clears the decision).
     */
    private static function requireApproval(Quote $quote): void
    {
        if ($quote->status !== QuoteStatus::Draft || $quote->approval_decision !== null) {
            return;
        }

        $quote->status = QuoteStatus::PendingApproval;
        $quote->save();

        Notification::send($quote->approvers()->get(), new QuoteApproval(
            $quote,
            __('Approval needed: :number', ['number' => $quote->number]),
            __(":owner's quote :number (total :total, discount :discount%) needs your approval before it can be sent.", [
                'owner' => $quote->owner?->name,
                'number' => $quote->number,
                'total' => $quote->total,
                'discount' => $quote->discount_percent,
            ]),
        ));
    }

    /**
     * Replace {field} placeholders with the record's values; {url} links to the record and
     * {owner} names its owner.
     */
    public static function fill(string $text, Model $model): string
    {
        return (string) preg_replace_callback('/\{(\w+)\}/', function (array $m) use ($model): string {
            return match ($m[1]) {
                'url' => route(Str::plural((string) array_search($model::class, self::models(), true)).'.show', $model),
                'owner' => (string) $model->getRelationValue('owner')?->getAttribute('name'),
                default => self::value($model, $m[1]) ?? '',
            };
        }, $text);
    }
}
