<?php

namespace App\Http\Controllers;

use App\Enums\ActivityType;
use App\Enums\LeadSource;
use App\Jobs\ExtractQuoteFromEmail;
use App\Models\Activity;
use App\Models\InboundEmail;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Emails read from mailboxes, for admins and sales managers: senders nobody knows (one
 * click makes them a lead), quote drafts to review, cases opened, and AI failures to retry.
 */
class InboxController extends Controller
{
    /**
     * @var array<string, string>
     */
    private const TABS = [
        'unmatched' => 'Unknown senders',
        'quotes' => 'Quote drafts',
        'cases' => 'Cases',
        'failed' => 'AI failed',
        'all' => 'All',
    ];

    public function index(Request $request): Response
    {
        $tab = array_key_exists((string) $request->query('tab'), self::TABS) ? (string) $request->query('tab') : 'unmatched';
        $emails = $this->inTab(InboundEmail::query(), $tab)
            ->with(['mailbox:id,name', 'contact:id,first_name,last_name', 'lead:id,first_name,last_name', 'supportCase:id,number', 'quote:id,number'])
            ->latest('received_at')->latest('id')
            ->paginate(25)->withQueryString()
            ->through(fn (InboundEmail $e): array => [
                ...$e->only(['id', 'from_email', 'from_name', 'subject', 'received_at', 'status', 'ai_status', 'ai_confidence', 'ai_cost', 'ai_error', 'contact_id', 'lead_id', 'support_case_id', 'quote_id']),
                'body' => Str::limit((string) $e->body, 5000, '…'),
                'mailbox' => $e->mailbox?->name,
                'contact' => $e->contact ? ['id' => $e->contact->id, 'name' => $e->contact->full_name] : null,
                'lead' => $e->lead ? ['id' => $e->lead->id, 'name' => $e->lead->full_name] : null,
                'case' => $e->supportCase?->only(['id', 'number']),
                'quote' => $e->quote?->only(['id', 'number']),
            ]);

        $month = InboundEmail::where('created_at', '>=', now()->startOfMonth());

        return Inertia::render('inbox/index', [
            'emails' => $emails,
            'tab' => $tab,
            'tabs' => collect(self::TABS)->map(fn (string $label, string $t): array => ['value' => $t, 'label' => __($label), 'count' => $this->inTab(InboundEmail::query(), $t)->count()])->values(),
            'usage' => [
                'emails' => (clone $month)->whereNotNull('ai_input_tokens')->count(),
                'tokens' => (int) (clone $month)->sum('ai_input_tokens') + (int) (clone $month)->sum('ai_output_tokens'),
                'cost' => (float) (clone $month)->sum('ai_cost'),
            ],
        ]);
    }

    /**
     * @param  Builder<InboundEmail>  $query
     * @return Builder<InboundEmail>
     */
    private function inTab(Builder $query, string $tab): Builder
    {
        return match ($tab) {
            'unmatched' => $query->where('status', 'unmatched')->whereNull('lead_id'),
            'quotes' => $query->whereNotNull('quote_id'),
            'cases' => $query->whereNotNull('support_case_id'),
            'failed' => $query->whereIn('ai_status', ['failed', 'skipped']),
            default => $query,
        };
    }

    /**
     * Make an unknown sender a lead (name from the From header), owned by the mailbox's
     * owner, with the email on its timeline.
     */
    public function createLead(InboundEmail $email): RedirectResponse
    {
        abort_if($email->lead_id !== null || $email->contact_id !== null, 409, __('This sender is already linked.'));

        $name = trim((string) $email->from_name) ?: Str::before($email->from_email, '@');
        $lead = Lead::create([
            'first_name' => Str::limit(Str::before($name, ' ') ?: $name, 100, ''),
            'last_name' => Str::limit(Str::contains($name, ' ') ? Str::after($name, ' ') : '-', 100, ''),
            'email' => $email->from_email,
            'source' => LeadSource::Email,
            'status' => 'new',
            'owner_id' => $email->mailbox->owner_id,
        ]);

        Activity::create([
            'type' => ActivityType::Email,
            'subject' => Str::limit("Email from {$email->from_email}: {$email->subject}", 250, '…'),
            'notes' => Str::limit((string) $email->body, 2000, '…'),
            'due_at' => $email->received_at,
            'owner_id' => $lead->owner_id,
            'regarding_type' => $lead->getMorphClass(),
            'regarding_id' => $lead->id,
        ])->forceFill(['done_at' => $email->received_at])->save();

        $email->update(['lead_id' => $lead->id, 'status' => 'matched']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added as a lead.', ['name' => $lead->full_name])]);

        return to_route('leads.show', $lead);
    }

    public function retry(InboundEmail $email): RedirectResponse
    {
        abort_unless(in_array($email->ai_status, ['failed', 'skipped'], true), 409, __('Only failed or skipped emails can be retried.'));

        $email->update(['ai_status' => 'pending', 'ai_error' => null]);
        ExtractQuoteFromEmail::dispatch($email);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Queued for another try.')]);

        return back();
    }
}
