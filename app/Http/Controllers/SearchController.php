<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\SupportCase;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * One box, every record type: names, emails, companies, phone numbers (matched on
 * digits only), case numbers and subjects, and contract names. Each model's visibility scope applies, so people only find what
 * they may open.
 */
class SearchController extends Controller
{
    private const PER_TYPE = 5;

    public function __invoke(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q'));

        if (mb_strlen($q) < 2) {
            return response()->json(['results' => []]);
        }

        $like = '%'.addcslashes($q, '%_\\').'%';
        $digits = preg_replace('/\D/', '', $q) ?? '';
        // ponytail: LIKE scans; add FULLTEXT indexes once tables reach tens of thousands of rows.
        $phone = fn (Builder $query) => strlen($digits) >= 4
            ? $query->orWhereRaw("regexp_replace(phone, '[^0-9]', '') like ?", ["%{$digits}%"])
            : $query;

        $leads = Lead::query()->where(fn (Builder $w) => $phone(
            $w->whereRaw("concat(first_name, ' ', last_name) like ?", [$like])
                ->orWhere('company', 'like', $like)->orWhere('email', 'like', $like),
        ))->limit(self::PER_TYPE)->get()->map(fn (Lead $l) => [
            'type' => 'lead', 'id' => $l->id, 'title' => $l->full_name,
            'subtitle' => $l->company ?? $l->email, 'url' => route('leads.show', $l),
        ]);

        $contacts = Contact::query()->with('account:id,name')->where(fn (Builder $w) => $phone(
            $w->whereRaw("concat(first_name, ' ', last_name) like ?", [$like])->orWhere('email', 'like', $like),
        ))->limit(self::PER_TYPE)->get()->map(fn (Contact $c) => [
            'type' => 'contact', 'id' => $c->id, 'title' => $c->full_name,
            'subtitle' => $c->account->name ?? $c->email, 'url' => route('contacts.show', $c),
        ]);

        $accounts = Account::query()->where(fn (Builder $w) => $phone(
            $w->where('name', 'like', $like)->orWhere('email', 'like', $like),
        ))->limit(self::PER_TYPE)->get()->map(fn (Account $a) => [
            'type' => 'account', 'id' => $a->id, 'title' => $a->name,
            'subtitle' => $a->industry ?? $a->email, 'url' => route('accounts.show', $a),
        ]);

        $deals = Deal::query()->with('account:id,name')->where('name', 'like', $like)
            ->limit(self::PER_TYPE)->get()->map(fn (Deal $d) => [
                'type' => 'deal', 'id' => $d->id, 'title' => $d->name,
                'subtitle' => $d->account?->name, 'url' => route('deals.show', $d),
            ]);

        $cases = SupportCase::query()->with('account:id,name')
            ->where(fn (Builder $w) => $w->where('number', 'like', $like)->orWhere('subject', 'like', $like))
            ->limit(self::PER_TYPE)->get()->map(fn (SupportCase $c) => [
                'type' => 'case', 'id' => $c->id, 'title' => "{$c->number} {$c->subject}",
                'subtitle' => $c->account?->name, 'url' => route('cases.show', $c),
            ]);

        $contracts = Contract::query()->with('account:id,name')->where('name', 'like', $like)
            ->limit(self::PER_TYPE)->get()->map(fn (Contract $c) => [
                'type' => 'contract', 'id' => $c->id, 'title' => $c->name,
                'subtitle' => $c->account?->name, 'url' => route('contracts.show', $c),
            ]);

        return response()->json(['results' => [...$leads, ...$contacts, ...$accounts, ...$deals, ...$cases, ...$contracts]]);
    }
}
