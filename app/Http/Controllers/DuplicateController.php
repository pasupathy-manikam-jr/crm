<?php

namespace App\Http\Controllers;

use App\Actions\Crm\MergeRecords;
use App\Models\Account;
use App\Support\Duplicates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use LogicException;

class DuplicateController extends Controller
{
    public function index(Request $request, string $type): Response
    {
        $groups = array_map(
            fn ($group) => $group->map(fn (Model $r) => [
                ...$r->only(['id', ...Duplicates::MERGEABLE[$type]]),
                'owner' => $r->getRelation('owner')?->only(['id', 'name']),
                'created_at' => $r->getAttribute('created_at'),
            ])->all(),
            Duplicates::groups($type),
        );

        return Inertia::render('duplicates/index', [
            'type' => $type,
            'groups' => $groups,
            'fields' => Duplicates::MERGEABLE[$type],
            'accounts' => $type === 'contacts' ? Account::pluck('name', 'id') : [],
        ]);
    }

    public function merge(Request $request, string $type, MergeRecords $merge): RedirectResponse
    {
        $validated = $request->validate([
            'survivor_id' => ['required', 'integer'],
            'ids' => ['required', 'array', 'min:2', 'max:20'],
            'ids.*' => ['integer'],
            'values' => ['array'],
            'values.*' => ['integer'],
        ]);

        try {
            $survivor = $merge($type, (int) $validated['survivor_id'], array_map('intval', $validated['ids']), array_map('intval', $validated['values'] ?? []));
        } catch (LogicException $e) {
            return back()->withErrors(['merge' => $e->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':count records merged.', ['count' => count($validated['ids'])])]);

        return to_route("{$type}.show", $survivor);
    }
}
