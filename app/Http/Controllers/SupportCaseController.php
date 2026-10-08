<?php

namespace App\Http\Controllers;

use App\Enums\CasePriority;
use App\Enums\CaseStatus;
use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\SupportCaseRequest;
use App\Models\SupportCase;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupportCaseController extends Controller
{
    use ListsRecords;

    /**
     * Cases, soonest SLA deadline first. status=active (the default) hides resolved and
     * closed cases; status=breached shows only open cases past their deadline.
     */
    public function index(Request $request): Response
    {
        $status = (string) $request->query('status') ?: 'active';
        $priority = CasePriority::tryFrom((string) $request->query('priority'));

        [$cases, $filters] = $this->listRecords(
            $request,
            SupportCase::with(['owner:id,name', 'account:id,name'])
                ->when($status === 'active', fn (Builder $q) => $q->whereNull('resolved_at'))
                ->when($status === 'breached', fn (Builder $q) => $q->breached())
                ->when(CaseStatus::tryFrom($status), fn (Builder $q, CaseStatus $s) => $q->where('status', $s))
                ->when($priority, fn (Builder $q) => $q->where('priority', $priority)),
            searchable: ['number', 'subject'],
            sortable: ['number', 'subject', 'priority', 'status', 'sla_due_at', 'created_at'],
            defaultSort: 'sla_due_at',
        );

        return Inertia::render('cases/index', [
            'prefill' => $this->prefill($request),
            'cases' => $cases,
            'filters' => [...$filters, 'status' => $status === 'active' ? '' : $status, 'priority' => $priority->value ?? ''],
            ...$this->formOptions($request),
        ]);
    }

    public function show(Request $request, SupportCase $case): Response
    {
        return Inertia::render('cases/show', [
            'supportCase' => $case->load(['owner:id,name', 'account:id,name', 'contact:id,first_name,last_name,email']),
            ...$this->formOptions($request),
            ...$this->recordTabProps($case),
        ]);
    }

    public function store(SupportCaseRequest $request): RedirectResponse
    {
        $case = SupportCase::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number opened.', ['number' => $case->number])]);

        return to_route('cases.show', $case);
    }

    public function update(SupportCaseRequest $request, SupportCase $case): RedirectResponse
    {
        $case->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number updated.', ['number' => $case->number])]);

        return back();
    }

    /**
     * One-click Resolve / Reopen from the case page.
     */
    public function updateStatus(Request $request, SupportCase $case): RedirectResponse
    {
        $case->update($request->validate(['status' => ['required', Rule::enum(CaseStatus::class)]]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number marked :status.', ['number' => $case->number, 'status' => mb_strtolower($case->status->label())])]);

        return back();
    }

    public function destroy(SupportCase $case): RedirectResponse
    {
        $case->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number deleted.', ['number' => $case->number])]);

        return to_route('cases.index');
    }

    /**
     * ?new=1&account=ID&contact=ID (from an account or contact page) opens the add form
     * with those filled in; the form request still checks the user can see them.
     *
     * @return array{account_id: int|null, contact_id: int|null}|null
     */
    private function prefill(Request $request): ?array
    {
        return $request->boolean('new') ? [
            'account_id' => $request->integer('account') ?: null,
            'contact_id' => $request->integer('contact') ?: null,
        ] : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            'owners' => $this->ownerOptions($request),
            'accounts' => $this->accountOptions(),
            'contacts' => $this->contactOptions(),
            'statuses' => CaseStatus::options(),
            'priorities' => CasePriority::options(),
        ];
    }
}
