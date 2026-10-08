<?php

namespace Tests\Concerns;

use App\Enums\UserRole;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Role;

trait CreatesUsersWithRoles
{
    protected function setUpCreatesUsersWithRoles(): void
    {
        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value);
        }
    }

    protected function userWithRole(UserRole $role, ?Team $team = null): User
    {
        return User::factory()->create(['team_id' => $team?->id])->assignRole($role->value);
    }
}
