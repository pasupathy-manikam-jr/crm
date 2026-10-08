<?php

namespace App\Http\Controllers;

use App\Enums\QuoteStatus;
use App\Models\Quote;
use App\Notifications\QuoteApproval;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class QuoteApprovalController extends Controller
{
    /**
     * Approve or reject a quote waiting for approval. Either way it returns to draft with the
     * decision recorded; a rejection needs a reason. The owner is told.
     */
    public function __invoke(Request $request, Quote $quote): RedirectResponse
    {
        abort_unless($quote->isLocked() && $quote->canBeApprovedBy($request->user()), 403);

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'note' => ['required_if:decision,rejected', 'nullable', 'string', 'max:2000'],
        ], ['note.required_if' => __('Give a reason for rejecting.')]);

        $quote->forceFill([
            'status' => QuoteStatus::Draft,
            'approval_decision' => $validated['decision'],
            'approval_note' => $validated['note'] ?? null,
            'approval_by' => $request->user()->id,
            'approval_at' => now(),
        ])->save();

        $approved = $validated['decision'] === 'approved';
        $line = $approved
            ? __(':name approved :number.', ['name' => $request->user()->name, 'number' => $quote->number])
            : __(':name rejected :number.', ['name' => $request->user()->name, 'number' => $quote->number]);

        $quote->owner?->notify(new QuoteApproval(
            $quote,
            $approved ? __(':number approved', ['number' => $quote->number]) : __(':number rejected', ['number' => $quote->number]),
            $line.(isset($validated['note']) ? ' '.__('Reason: :note', ['note' => $validated['note']]) : ''),
        ));

        Inertia::flash('toast', ['type' => 'success', 'message' => $approved
            ? __(':number approved.', ['number' => $quote->number])
            : __(':number rejected.', ['number' => $quote->number])]);

        return back();
    }
}
