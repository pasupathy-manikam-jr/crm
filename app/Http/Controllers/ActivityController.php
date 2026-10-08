<?php

namespace App\Http\Controllers;

use App\Enums\ActivityType;
use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\ActivityRequest;
use App\Models\Activity;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    use ListsRecords;

    /**
     * Tabs of the My tasks page: each narrows the open/done activities and sets their order.
     *
     * @var array<string, array{0: string, 1: 'asc'|'desc'}>
     */
    private const TABS = [
        'overdue' => ['due_at', 'asc'],
        'today' => ['due_at', 'asc'],
        'upcoming' => ['due_at', 'asc'],
        'unscheduled' => ['created_at', 'desc'],
        'done' => ['done_at', 'desc'],
    ];

    /**
     * My tasks: the signed-in user's activities by default; owner=everyone shows everyone the
     * user can see, owner=<id> one person.
     */
    public function index(Request $request): Response
    {
        $tab = array_key_exists((string) $request->query('tab'), self::TABS) ? (string) $request->query('tab') : 'today';

        if (! $request->has('owner')) {
            $request->query->set('owner', (string) $request->user()->id);
        }

        $base = Activity::query()->with(['owner:id,name', 'regarding']);
        [$sort, $direction] = self::TABS[$tab];

        [$activities, $filters] = $this->listRecords(
            $request,
            $this->inTab($base->clone(), $tab),
            searchable: ['subject'],
            sortable: [],
            defaultSort: $sort,
            defaultDirection: $direction,
        );

        $owner = $filters['owner'];
        $counts = collect(array_keys(self::TABS))->mapWithKeys(fn (string $t): array => [
            $t => $this->inTab(Activity::query(), $t)->when(ctype_digit($owner), fn (Builder $q) => $q->where('owner_id', (int) $owner))->count(),
        ]);

        return Inertia::render('activities/index', [
            'activities' => $activities->through(fn (Activity $a): array => $this->present($a)),
            'filters' => [...$filters, 'tab' => $tab, 'owner' => $owner === (string) $request->user()->id ? '' : $owner],
            'counts' => $counts,
            'owners' => $this->ownerOptions($request),
            'types' => ActivityType::options(),
        ]);
    }

    /**
     * Month calendar of scheduled activities (whole weeks, Monday first). Owner works as on
     * My tasks: the signed-in user by default, "everyone", or one person's id.
     */
    public function calendar(Request $request): Response
    {
        $requested = (string) $request->query('month');
        $month = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $requested) === 1
            ? CarbonImmutable::parse("{$requested}-01")
            : today()->startOfMonth();
        $from = $month->startOfMonth()->startOfWeek(CarbonInterface::MONDAY);
        $to = $month->endOfMonth()->endOfWeek(CarbonInterface::SUNDAY);
        $owner = (string) $request->query('owner', (string) $request->user()->id);

        $activities = Activity::with(['owner:id,name', 'regarding'])
            ->whereBetween('due_at', [$from, $to])
            ->when(ctype_digit($owner), fn (Builder $q) => $q->where('owner_id', (int) $owner))
            ->orderBy('due_at')
            ->get()
            ->map(fn (Activity $a): array => self::present($a))
            ->values();

        return Inertia::render('activities/calendar', [
            'month' => $month->format('Y-m'),
            'activities' => $activities,
            'filters' => ['owner' => $owner === (string) $request->user()->id ? '' : $owner],
            'owners' => $this->ownerOptions($request),
            'types' => ActivityType::options(),
        ]);
    }

    /**
     * Move to another day from the calendar, keeping the time (9:00 if it had none).
     */
    public function reschedule(Request $request, Activity $activity): RedirectResponse
    {
        $date = (string) $request->validate(['date' => ['required', 'date_format:Y-m-d']])['date'];
        $activity->due_at = CarbonImmutable::parse($date.' '.($activity->due_at?->format('H:i') ?? '09:00'));
        $activity->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':subject moved to :date.', ['subject' => $activity->subject, 'date' => $activity->due_at->translatedFormat('j M')])]);

        return back();
    }

    public function store(ActivityRequest $request): RedirectResponse
    {
        $activity = Activity::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':type logged.', ['type' => $activity->type->label()])]);

        return back();
    }

    public function update(ActivityRequest $request, Activity $activity): RedirectResponse
    {
        $activity->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':subject updated.', ['subject' => $activity->subject])]);

        return back();
    }

    /**
     * Mark done, or reopen if it was already done.
     */
    public function toggleDone(Activity $activity): RedirectResponse
    {
        $activity->done_at = $activity->done_at === null ? now() : null;
        $activity->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => $activity->done_at ? __('Done: :subject.', ['subject' => $activity->subject]) : __('Reopened: :subject.', ['subject' => $activity->subject])]);

        return back();
    }

    public function destroy(Activity $activity): RedirectResponse
    {
        $activity->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':subject deleted.', ['subject' => $activity->subject])]);

        return back();
    }

    /**
     * @param  Builder<Activity>  $query
     * @return Builder<Activity>
     */
    private function inTab(Builder $query, string $tab): Builder
    {
        return match ($tab) {
            'overdue' => $query->overdue(),
            'today' => $query->whereNull('done_at')->whereBetween('due_at', [today(), today()->endOfDay()]),
            'upcoming' => $query->whereNull('done_at')->where('due_at', '>', today()->endOfDay()),
            'unscheduled' => $query->whereNull('done_at')->whereNull('due_at'),
            default => $query->whereNotNull('done_at'),
        };
    }

    /**
     * An activity with a display name and link for whatever it's about.
     *
     * @return array<string, mixed>
     */
    public static function present(Activity $activity): array
    {
        $regarding = $activity->regarding;

        return [
            ...$activity->only(['id', 'type', 'subject', 'notes', 'due_at', 'done_at', 'owner_id', 'regarding_type', 'regarding_id']),
            'owner' => $activity->owner?->only(['id', 'name']),
            'regarding' => $regarding === null ? null : [
                'type' => $activity->regarding_type,
                'id' => $regarding->getKey(),
                'name' => $regarding->getAttribute('name') ?? $regarding->getAttribute('full_name') ?? $regarding->getAttribute('subject'),
            ],
        ];
    }
}
