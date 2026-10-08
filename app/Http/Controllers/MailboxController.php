<?php

namespace App\Http\Controllers;

use App\Actions\Mail\SyncMailbox;
use App\Http\Requests\Users\MailboxRequest;
use App\Models\Mailbox;
use App\Models\User;
use App\Support\Mail\ImapInbox;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class MailboxController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('mailboxes/index', [
            'mailboxes' => Mailbox::with('owner:id,name')->withCount('emails')->orderBy('name')->get(),
            'owners' => User::orderBy('name')->get(['id', 'name'])->map(fn (User $u): array => ['value' => (string) $u->id, 'label' => $u->name]),
            'aiReady' => filled(config('services.anthropic.key')),
        ]);
    }

    public function store(MailboxRequest $request): RedirectResponse
    {
        Mailbox::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mailbox added. Test the connection, then turn it on.')]);

        return back();
    }

    public function update(MailboxRequest $request, Mailbox $mailbox): RedirectResponse
    {
        $mailbox->update(array_filter($request->validated(), fn (mixed $v, string $k): bool => $k !== 'password' || filled($v), ARRAY_FILTER_USE_BOTH));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name saved.', ['name' => $mailbox->name])]);

        return back();
    }

    public function destroy(Mailbox $mailbox): RedirectResponse
    {
        $mailbox->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted with its imported emails. Cases and quotes made from them stay.', ['name' => $mailbox->name])]);

        return back();
    }

    public function test(Mailbox $mailbox, ImapInbox $inbox): RedirectResponse
    {
        try {
            $inbox->test($mailbox);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Connected to :name.', ['name' => $mailbox->name])]);
        } catch (Throwable $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Couldn\'t connect: :error', ['error' => $e->getMessage()])]);
        }

        return back();
    }

    public function sync(Mailbox $mailbox, SyncMailbox $sync): RedirectResponse
    {
        $filed = $sync->handle($mailbox);

        Inertia::flash('toast', $mailbox->last_error === null
            ? ['type' => 'success', 'message' => __(':name: :filed new email(s).', ['name' => $mailbox->name, 'filed' => $filed])]
            : ['type' => 'error', 'message' => __(':name: :error', ['name' => $mailbox->name, 'error' => $mailbox->last_error])]);

        return back();
    }
}
