<?php

namespace App\Http\Controllers;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Enums\StageKind;
use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\LeadRequest;
use App\Models\Lead;
use App\Models\Stage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    use ListsRecords;

    public function index(Request $request): Response
    {
        $status = LeadStatus::tryFrom((string) $request->query('status'));

        [$leads, $filters] = $this->listRecords(
            $request,
            Lead::with('owner:id,name')->when($status, fn ($query) => $query->where('status', $status)),
            searchable: ['first_name', 'last_name', 'company', 'email', 'phone'],
            sortable: ['last_name', 'company', 'status', 'created_at'],
            defaultSort: 'created_at',
            defaultDirection: 'desc',
        );

        return Inertia::render('leads/index', [
            'leads' => $leads,
            'csvFields' => $this->csvFields('leads'),
            'filters' => [...$filters, 'status' => $status->value ?? ''],
            ...$this->formOptions($request),
            ...$this->conversionOptions(),
        ]);
    }

    public function show(Request $request, Lead $lead): Response
    {
        return Inertia::render('leads/show', [
            'lead' => $lead->load(['owner:id,name', 'convertedAccount:id,name', 'convertedContact:id,first_name,last_name', 'convertedDeal:id,name']),
            ...$this->formOptions($request),
            ...$this->conversionOptions(),
            ...$this->recordTabProps($lead),
        ]);
    }

    public function store(LeadRequest $request): RedirectResponse
    {
        $lead = Lead::create($request->validated());

        $this->flashCreated($lead, "{$lead->full_name}");

        return to_route('leads.show', $lead);
    }

    public function update(LeadRequest $request, Lead $lead): RedirectResponse
    {
        $lead->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $lead->full_name])]);

        return back();
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $lead->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $lead->full_name])]);

        return to_route('leads.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            'owners' => $this->ownerOptions($request),
            'statuses' => LeadStatus::options(),
            'sources' => LeadSource::options(),
        ];
    }

    /**
     * What the Convert dialog needs: accounts to convert into, and open stages for the deal.
     *
     * @return array<string, mixed>
     */
    private function conversionOptions(): array
    {
        return [
            'accounts' => $this->accountOptions(),
            'stages' => Stage::where('kind', StageKind::Open)->orderBy('position')->get(['id', 'name']),
        ];
    }
}
