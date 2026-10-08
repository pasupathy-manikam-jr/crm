<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ListsRecords;
use App\Http\Requests\Crm\ContactRequest;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    use ListsRecords;

    public function index(Request $request): Response
    {
        [$contacts, $filters] = $this->listRecords(
            $request,
            Contact::with(['owner:id,name', 'account:id,name']),
            searchable: ['first_name', 'last_name', 'email', 'phone', 'job_title'],
            sortable: ['last_name', 'first_name', 'created_at'],
            defaultSort: 'last_name',
        );

        return Inertia::render('contacts/index', [
            'contacts' => $contacts,
            'csvFields' => $this->csvFields('contacts'),
            'filters' => $filters,
            'owners' => $this->ownerOptions($request),
            'accounts' => $this->accountOptions(),
        ]);
    }

    public function show(Request $request, Contact $contact): Response
    {
        return Inertia::render('contacts/show', [
            'contact' => $contact->load([
                'owner:id,name',
                'account:id,name',
                'supportCases' => fn ($query) => $query->orderByRaw('resolved_at is not null')->orderBy('sla_due_at')->limit(20),
                'contracts' => fn ($query) => $query->orderByDesc('end_date')->limit(20),
            ]),
            'owners' => $this->ownerOptions($request),
            'accounts' => $this->accountOptions(),
            ...$this->recordTabProps($contact),
        ]);
    }

    public function store(ContactRequest $request): RedirectResponse
    {
        $contact = Contact::create($request->validated());

        $this->flashCreated($contact, "{$contact->full_name}");

        return to_route('contacts.show', $contact);
    }

    public function update(ContactRequest $request, Contact $contact): RedirectResponse
    {
        $contact->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $contact->full_name])]);

        return back();
    }

    public function destroy(Contact $contact): RedirectResponse
    {
        $contact->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $contact->full_name])]);

        return to_route('contacts.index');
    }
}
