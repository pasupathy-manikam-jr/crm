<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\TeamRequest;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('teams/index', [
            'teams' => Team::withCount('users')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(TeamRequest $request): RedirectResponse
    {
        $team = Team::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $team->name])]);

        return back();
    }

    public function update(TeamRequest $request, Team $team): RedirectResponse
    {
        $team->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $team->name])]);

        return back();
    }

    /**
     * Delete a team; its members stay, without a team.
     */
    public function destroy(Team $team): RedirectResponse
    {
        $team->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $team->name])]);

        return back();
    }
}
