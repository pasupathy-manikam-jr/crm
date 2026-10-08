<?php

namespace App\Http\Controllers;

use App\Http\Requests\Crm\NoteRequest;
use App\Models\Note;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NoteController extends Controller
{
    public function store(NoteRequest $request): RedirectResponse
    {
        Note::create([...$request->validated(), 'user_id' => $request->user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note added.')]);

        return back();
    }

    /**
     * Authors delete their own notes; admins any. The record must still be visible.
     */
    public function destroy(Request $request, Note $note): RedirectResponse
    {
        abort_if($note->notable === null, 404);
        abort_unless($note->user_id === $request->user()->id || $request->user()->can('manage-users'), 403);

        $note->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note deleted.')]);

        return back();
    }
}
