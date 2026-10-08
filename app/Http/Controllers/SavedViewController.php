<?php

namespace App\Http\Controllers;

use App\Models\SavedView;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Each user's saved list filters. Views are private: users only ever see or delete their own.
 */
class SavedViewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'list' => ['required', Rule::in(SavedView::LISTS)],
            'name' => ['required', 'string', 'max:60'],
            'query' => ['nullable', 'array'],
            'query.*' => ['nullable', 'string', 'max:255'],
        ], [], ['name' => __('view name')]);

        $query = array_filter(
            array_intersect_key($validated['query'] ?? [], array_flip(SavedView::KEYS)),
            fn ($v) => $v !== null && $v !== '',
        );

        $request->user()->savedViews()->updateOrCreate(
            ['list' => $validated['list'], 'name' => $validated['name']],
            ['query' => $query],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('View “:name” saved.', ['name' => $validated['name']])]);

        return back();
    }

    public function destroy(Request $request, int $view): RedirectResponse
    {
        $saved = $request->user()->savedViews()->findOrFail($view);
        $saved->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('View “:name” deleted.', ['name' => $saved->name])]);

        return back();
    }
}
