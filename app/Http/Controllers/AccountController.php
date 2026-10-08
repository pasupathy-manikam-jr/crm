<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\AccountRequest;
use App\Models\Account;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    use ListsRecords;

    public function index(Request $request): Response
    {
        [$accounts, $filters] = $this->listRecords(
            $request,
            Account::with('owner:id,name')->withCount('contacts'),
            searchable: ['name', 'email', 'phone', 'industry'],
            sortable: ['name', 'industry', 'created_at'],
            defaultSort: 'name',
        );

        return Inertia::render('accounts/index', [
            'accounts' => $accounts,
            'csvFields' => $this->csvFields('accounts'),
            'filters' => $filters,
            'owners' => $this->ownerOptions($request),
        ]);
    }

    public function show(Request $request, Account $account): Response
    {
        return Inertia::render('accounts/show', [
            'account' => $account->load([
                'owner:id,name',
                'contacts' => fn ($query) => $query->with('owner:id,name')->orderBy('last_name'),
                'deals' => fn ($query) => $query->with('stage:id,name,kind')->latest(),
                'supportCases' => fn ($query) => $query->orderByRaw('resolved_at is not null')->orderBy('sla_due_at')->limit(20),
                'contracts' => fn ($query) => $query->orderByDesc('end_date')->limit(20),
            ]),
            'owners' => $this->ownerOptions($request),
            ...$this->recordTabProps($account),
        ]);
    }

    public function store(AccountRequest $request): RedirectResponse
    {
        $account = Account::create($request->validated());

        $this->flashCreated($account, "{$account->name}");

        return to_route('accounts.show', $account);
    }

    public function update(AccountRequest $request, Account $account): RedirectResponse
    {
        $account->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $account->name])]);

        return back();
    }

    /**
     * Delete the account; its contacts stay, without an account.
     */
    public function destroy(Account $account): RedirectResponse
    {
        $account->delete();
        $account->contacts()->update(['account_id' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $account->name])]);

        return to_route('accounts.index');
    }
}
