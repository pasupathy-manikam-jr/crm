<?php

namespace App\Http\Controllers;

use App\Enums\QuoteStatus;
use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\QuoteRequest;
use App\Models\Deal;
use App\Models\InboundEmail;
use App\Models\Product;
use App\Models\Quote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QuoteController extends Controller
{
    use ListsRecords;

    public function index(Request $request): Response
    {
        $status = QuoteStatus::tryFrom((string) $request->query('status'));

        [$quotes, $filters] = $this->listRecords(
            $request,
            Quote::with(['owner:id,name', 'account:id,name'])->when($status, fn ($q) => $q->where('status', $status)),
            searchable: ['number'],
            sortable: ['number', 'total', 'valid_until', 'created_at'],
            defaultSort: 'created_at',
            defaultDirection: 'desc',
        );

        return Inertia::render('quotes/index', [
            'quotes' => $quotes,
            'filters' => [...$filters, 'status' => $status->value ?? ''],
            'owners' => $this->ownerOptions($request),
            'statuses' => QuoteStatus::options(),
        ]);
    }

    /**
     * New quote, prefilled from a deal when started from one (?deal=ID).
     */
    public function create(Request $request): Response
    {
        $deal = $request->filled('deal') ? Deal::find((int) $request->query('deal')) : null;

        return Inertia::render('quotes/form', [
            'quote' => null,
            'prefill' => $deal ? ['deal_id' => $deal->id, 'account_id' => $deal->account_id, 'contact_id' => $deal->contact_id] : null,
            ...$this->formOptions($request),
        ]);
    }

    public function store(QuoteRequest $request): RedirectResponse
    {
        $quote = DB::transaction(function () use ($request): Quote {
            $quote = Quote::create($request->safe()->except('items'));
            $quote->syncItems($request->validated('items'));

            return $quote;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number created.', ['number' => $quote->number])]);

        return to_route('quotes.show', $quote);
    }

    public function show(Request $request, Quote $quote): Response
    {
        return Inertia::render('quotes/show', [
            'quote' => $quote->load(['items', 'owner:id,name', 'account', 'contact', 'deal:id,name', 'approver:id,name']),
            'canApprove' => $quote->isLocked() && $quote->canBeApprovedBy($request->user()),
            // The email a draft was made from, shown beside it for review.
            'sourceEmail' => InboundEmail::where('quote_id', $quote->id)->first(['from_email', 'from_name', 'subject', 'body', 'received_at']),
            'company' => config('app.name'),
            'statuses' => QuoteStatus::options(),
        ]);
    }

    public function edit(Request $request, Quote $quote): Response
    {
        abort_if($quote->isLocked(), 403, __('This quote is waiting for approval.'));

        return Inertia::render('quotes/form', [
            'quote' => $quote->load('items'),
            'prefill' => null,
            ...$this->formOptions($request),
        ]);
    }

    public function update(QuoteRequest $request, Quote $quote): RedirectResponse
    {
        abort_if($quote->isLocked(), 403, __('This quote is waiting for approval.'));

        DB::transaction(function () use ($request, $quote): void {
            // A changed quote needs a fresh decision, so approval rules look at it again.
            $quote->forceFill(['approval_decision' => null, 'approval_note' => null, 'approval_by' => null, 'approval_at' => null]);
            $quote->update($request->safe()->except('items'));
            $quote->syncItems($request->validated('items'));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number saved.', ['number' => $quote->number])]);

        return to_route('quotes.show', $quote);
    }

    public function updateStatus(Request $request, Quote $quote): RedirectResponse
    {
        abort_if($quote->isLocked(), 403, __('This quote is waiting for approval.'));

        $validated = $request->validate(['status' => ['required', Rule::enum(QuoteStatus::class)->except(QuoteStatus::PendingApproval)]]);
        $quote->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number marked :status.', ['number' => $quote->number, 'status' => mb_strtolower($quote->status->label())])]);

        return back();
    }

    public function destroy(Quote $quote): RedirectResponse
    {
        $quote->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number deleted.', ['number' => $quote->number])]);

        return to_route('quotes.index');
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
            'deals' => Deal::orderBy('name')->get(['id', 'name', 'account_id'])
                ->map(fn (Deal $d) => ['value' => (string) $d->id, 'label' => $d->name, 'account_id' => $d->account_id])->values(),
            'products' => Product::where('active', true)->orderBy('name')->get(['id', 'name', 'sku', 'unit_price', 'tax_rate']),
        ];
    }
}
