<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    /**
     * @return array<string, array{UserRole, bool}>
     */
    public static function roles(): array
    {
        return [
            'admin' => [UserRole::Admin, true],
            'sales manager' => [UserRole::SalesManager, false],
            'sales rep' => [UserRole::SalesRep, false],
        ];
    }

    #[DataProvider('roles')]
    public function test_only_admins_can_manage_users(UserRole $role, bool $allowed)
    {
        $this->assertSame($allowed, $this->userWithRole($role)->can('manage-users'));
    }

    public function test_guests_are_sent_to_login()
    {
        $this->get(route('users.index'))->assertRedirect(route('login'));
    }

    public function test_non_admins_are_refused()
    {
        $this->actingAs($this->userWithRole(UserRole::SalesManager))
            ->get(route('users.index'))
            ->assertForbidden();
    }

    public function test_admin_adds_a_user_with_role_and_team()
    {
        $team = Team::factory()->create();

        $this->actingAs($this->userWithRole(UserRole::Admin))
            ->post(route('users.store'), [
                'name' => 'Siti Rahman',
                'email' => 'siti@example.com',
                'role' => UserRole::SalesRep->value,
                'team_id' => $team->id,
                'password' => 'Zx123456',
            ])
            ->assertRedirect(route('users.index'));

        $user = User::where('email', 'siti@example.com')->firstOrFail();
        $this->assertSame(UserRole::SalesRep, $user->role());
        $this->assertSame($team->id, $user->team_id);
        $this->assertTrue(Hash::check('Zx123456', $user->password));
    }

    public function test_adding_a_user_requires_name_email_role_and_password()
    {
        $this->actingAs($this->userWithRole(UserRole::Admin))
            ->post(route('users.store'), [])
            ->assertSessionHasErrors([
                'name' => 'The name field is required.',
                'email' => 'The email field is required.',
                'role' => 'The role field is required.',
                'password' => 'The password field is required.',
            ]);
    }

    public function test_editing_without_a_password_keeps_it_and_no_team_clears_the_team()
    {
        $rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());

        $this->actingAs($this->userWithRole(UserRole::Admin))
            ->put(route('users.update', $rep), [
                'name' => 'Renamed',
                'email' => $rep->email,
                'role' => UserRole::SalesManager->value,
                'team_id' => 'none',
                'password' => '',
            ])
            ->assertSessionHasNoErrors();

        $rep->refresh();
        $this->assertSame('Renamed', $rep->name);
        $this->assertNull($rep->team_id);
        $this->assertSame(UserRole::SalesManager, $rep->role());
        $this->assertTrue(Hash::check('password', $rep->password));
    }

    public function test_admins_cannot_remove_their_own_admin_role()
    {
        $admin = $this->userWithRole(UserRole::Admin);

        $this->actingAs($admin)
            ->put(route('users.update', $admin), [
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => UserRole::SalesRep->value,
            ])
            ->assertSessionHasErrors(['role' => 'You can\'t remove your own admin role.']);

        $this->assertSame(UserRole::Admin, $admin->fresh()->role());
    }

    public function test_admins_can_delete_others_but_not_themselves()
    {
        $admin = $this->userWithRole(UserRole::Admin);
        $rep = $this->userWithRole(UserRole::SalesRep);

        $this->actingAs($admin)->delete(route('users.destroy', $admin));
        $this->actingAs($admin)->delete(route('users.destroy', $rep));

        $this->assertModelExists($admin);
        $this->assertModelMissing($rep);
    }

    public function test_deleting_a_team_keeps_its_members_without_a_team()
    {
        $team = Team::factory()->create();
        $rep = $this->userWithRole(UserRole::SalesRep, $team);

        $this->actingAs($this->userWithRole(UserRole::Admin))
            ->delete(route('teams.destroy', $team));

        $this->assertModelMissing($team);
        $this->assertNull($rep->fresh()->team_id);
    }

    public function test_team_names_are_unique()
    {
        Team::factory()->create(['name' => 'Sales']);

        $this->actingAs($this->userWithRole(UserRole::Admin))
            ->post(route('teams.store'), ['name' => 'Sales'])
            ->assertSessionHasErrors(['name' => 'The name has already been taken.']);
    }

    public function test_admins_see_everyone_managers_their_team_and_reps_themselves()
    {
        $team = Team::factory()->create();
        $manager = $this->userWithRole(UserRole::SalesManager, $team);
        $rep = $this->userWithRole(UserRole::SalesRep, $team);
        $outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $loneManager = $this->userWithRole(UserRole::SalesManager);

        $this->assertNull($this->userWithRole(UserRole::Admin)->visibleOwnerIds());
        $this->assertEqualsCanonicalizing([$manager->id, $rep->id], $manager->visibleOwnerIds());
        $this->assertSame([$rep->id], $rep->visibleOwnerIds());
        $this->assertSame([$loneManager->id], $loneManager->visibleOwnerIds());
        $roleless = User::factory()->create(['team_id' => $team->id]);
        $this->assertSame([$roleless->id], $roleless->visibleOwnerIds());
        $this->assertNotContains($outsider->id, $manager->visibleOwnerIds());
    }
}
