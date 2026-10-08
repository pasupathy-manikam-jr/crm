<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\Users\UserRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * List the CRM's users, optionally filtered by name or email.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search'));

        $users = User::query()
            ->with(['team:id,name', 'roles:id,name'])
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role()?->value,
                'role_label' => $user->role()?->label(),
                'team_id' => $user->team_id,
                'team' => $user->team?->name,
            ]);

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => ['search' => $search],
            'roles' => UserRole::options(),
            'teams' => Team::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $user = User::create([
            ...$request->safe()->only(['name', 'email', 'team_id', 'password']),
            'email_verified_at' => now(),
        ]);
        $user->syncRoles([$request->validated('role')]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $user->name])]);

        return to_route('users.index');
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $user->fill($request->safe()->only(['name', 'email', 'team_id']));

        if ($request->filled('password')) {
            $user->password = $request->validated('password');
        }

        $user->save();
        $user->syncRoles([$request->validated('role')]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $user->name])]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('You can\'t delete your own account here.')]);

            return back();
        }

        if ($user->ownsRecords()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __(':name still owns accounts, contacts or leads. Give them to someone else first.', ['name' => $user->name])]);

            return back();
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $user->name])]);

        return back();
    }
}
