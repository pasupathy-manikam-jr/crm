<?php

namespace App\Http\Controllers;

use App\Enums\ContractStatus;
use App\Enums\StageKind;
use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\ContractRequest;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\Stage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    use ListsRecords;

    /**
     * Contracts, soonest end first. status=expiring shows active contracts ending within 60 days.
     */
    public function index(Request $request): Response
    {
        $status = (string) $request->query('status');

        [$contracts, $filters] = $this->listRecords(
            $request,
            Contract::with(['owner:id,name', 'account:id,name'])
                ->when(ContractStatus::tryFrom($status), fn (Builder $q, ContractStatus $s) => $q->where('status', $s))
                ->when($status === 'expiring', fn (Builder $q) => $q->where('status', ContractStatus::Active)->where('end_date', '<=', today()->addDays(60))),
            searchable: ['name'],
            sortable: ['name', 'status', 'start_date', 'end_date', 'value'],
            defaultSort: 'end_date',
        );

        return Inertia::render('contracts/index', [
            'prefill' => $this->prefill($request),
            'contracts' => $contracts,
            'filters' => [...$filters, 'status' => $status],
            ...$this->formOptions($request),
        ]);
    }

    public function show(Request $request, Contract $contract): Response
    {
        return Inertia::render('contracts/show', [
            'contract' => $contract->load(['owner:id,name', 'account:id,name', 'contact:id,first_name,last_name,email', 'quote:id,number,total', 'renewalDeal:id,name']),
            ...$this->formOptions($request),
            ...$this->recordTabProps($contract),
        ]);
    }

    public function store(ContractRequest $request): RedirectResponse
    {
        $contract = Contract::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $contract->name])]);

        return to_route('contracts.show', $contract);
    }

    public function update(ContractRequest $request, Contract $contract): RedirectResponse
    {
        $contract->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $contract->name])]);

        return back();
    }

    public function destroy(Contract $contract): RedirectResponse
    {
        $contract->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $contract->name])]);

        return to_route('contracts.index');
    }

    /**
     * Open a renewal deal for the next term (same account, contact and value, closing on the
     * end date, in the first open stage) and mark the contract renewed.
     */
    public function renew(Contract $contract): RedirectResponse
    {
        abort_if($contract->renewal_deal_id !== null, 409, __('This contract already has a renewal deal.'));

        $deal = DB::transaction(function () use ($contract): Deal {
            $deal = Deal::create([
                'name' => "Renewal: {$contract->name}",
                'account_id' => $contract->account_id,
                'contact_id' => $contract->contact_id,
                'amount' => $contract->value,
                'stage_id' => Stage::where('kind', StageKind::Open)->orderBy('position')->valueOrFail('id'),
                'expected_close_date' => $contract->end_date->toDateString(),
                'owner_id' => $contract->owner_id,
            ]);

            $contract->update(['status' => ContractStatus::Renewed]);
            $contract->forceFill(['renewal_deal_id' => $deal->id])->save();

            return $deal;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Renewal deal opened for :name.', ['name' => $contract->name])]);

        return to_route('deals.show', $deal);
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
            'quotes' => Quote::orderByDesc('id')->get(['id', 'number', 'account_id'])
                ->map(fn (Quote $q): array => ['value' => (string) $q->id, 'label' => $q->number, 'account_id' => $q->account_id])
                ->values()->all(),
            'statuses' => ContractStatus::options(),
        ];
    }
}
