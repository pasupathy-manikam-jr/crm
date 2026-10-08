<?php

namespace App\Http\Controllers;

use App\Enums\StageKind;
use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\DealRequest;
use App\Models\Deal;
use App\Models\Stage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    use ListsRecords;

    /**
     * The pipeline as a board (one column per stage) or as a sortable list.
     */
    public function index(Request $request): Response
    {
        $board = $request->query('view') !== 'list';
        $query = Deal::with(['owner:id,name', 'account:id,name', 'stage:id,name,kind']);

        if ($board) {
            $search = trim((string) $request->query('search'));
            $owner = (string) $request->query('owner');

            $deals = $query
                ->when($search !== '', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"))
                ->when(ctype_digit($owner), fn (Builder $q) => $q->where('owner_id', (int) $owner))
                // ponytail: closed deals older than 90 days drop off the board; the list view keeps them all.
                ->where(fn (Builder $q) => $q->whereNull('closed_at')->orWhere('closed_at', '>=', now()->subDays(90)))
                ->orderByRaw('expected_close_date is null')
                ->orderBy('expected_close_date')
                ->get();
            $filters = ['search' => $search, 'owner' => $owner, 'sort' => '', 'direction' => ''];
        } else {
            [$deals, $filters] = $this->listRecords(
                $request,
                $query,
                searchable: ['name'],
                sortable: ['name', 'amount', 'expected_close_date', 'created_at'],
                defaultSort: 'expected_close_date',
            );
        }

        return Inertia::render('deals/index', [
            'view' => $board ? 'board' : 'list',
            'deals' => $deals,
            'filters' => [...$filters, 'view' => $board ? '' : 'list'],
            ...$this->formOptions($request),
        ]);
    }

    public function show(Request $request, Deal $deal): Response
    {
        return Inertia::render('deals/show', [
            'deal' => $deal->load(['owner:id,name', 'account:id,name', 'contact:id,first_name,last_name,email', 'stage']),
            ...$this->formOptions($request),
            ...$this->recordTabProps($deal),
        ]);
    }

    public function store(DealRequest $request): RedirectResponse
    {
        $deal = Deal::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $deal->name])]);

        return to_route('deals.show', $deal);
    }

    public function update(DealRequest $request, Deal $deal): RedirectResponse
    {
        $deal->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $deal->name])]);

        return back();
    }

    /**
     * Move a deal to another stage, from the board or the deal's page.
     */
    public function moveStage(Request $request, Deal $deal): RedirectResponse
    {
        $validated = $request->validate(['stage_id' => ['required', 'integer', Rule::exists(Stage::class, 'id')]]);
        $stage = Stage::findOrFail((int) $validated['stage_id']);

        $deal->moveTo($stage);

        $message = match ($stage->kind) {
            StageKind::Won => __(':name won.', ['name' => $deal->name]),
            StageKind::Lost => __(':name marked lost.', ['name' => $deal->name]),
            StageKind::Open => __(':name moved to :stage.', ['name' => $deal->name, 'stage' => $stage->name]),
        };
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    public function destroy(Deal $deal): RedirectResponse
    {
        $deal->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $deal->name])]);

        return to_route('deals.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            'stages' => Stage::orderBy('position')->get(['id', 'name', 'probability', 'kind']),
            'owners' => $this->ownerOptions($request),
            'accounts' => $this->accountOptions(),
            'contacts' => $this->contactOptions(),
        ];
    }
}
