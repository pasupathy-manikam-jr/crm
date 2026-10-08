<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Lead;
use App\Models\SupportCase;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-08 10:00'));
        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
    }

    /**
     * @param  list<string>  $abilities
     * @return array<string, string>
     */
    private function bearer(array $abilities = ['read', 'write'], ?User $user = null): array
    {
        return ['Authorization' => 'Bearer '.($user ?? $this->rep)->createToken('test', $abilities)->plainTextToken];
    }

    public function test_listing_is_scoped_to_what_the_token_user_sees_and_filters()
    {
        $old = Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Aina', 'updated_at' => '2026-10-01 09:00']);
        $new = Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Bala']);
        $hidden = Lead::factory()->create();
        $headers = $this->bearer(['read']);

        $this->getJson(route('api.v1.leads.index'), $headers)->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.type', 'lead')
            ->assertJsonPath('data.0.id', $old->id)
            ->assertJsonPath('data.0.url', route('leads.show', $old));
        $this->getJson(route('api.v1.leads.index', ['search' => 'bala']), $headers)->assertJsonPath('meta.total', 1);
        $this->getJson(route('api.v1.leads.index', ['updated_since' => '2026-10-05']), $headers)->assertJsonPath('data.0.id', $new->id)->assertJsonPath('meta.total', 1);
        $this->getJson(route('api.v1.leads.show', $hidden), $headers)->assertNotFound();
        $this->app->make('auth')->forgetGuards();
        $this->getJson(route('api.v1.leads.index'))->assertUnauthorized();
    }

    public function test_a_read_token_cannot_write()
    {
        $this->postJson(route('api.v1.leads.store'), ['first_name' => 'A', 'last_name' => 'B', 'status' => 'new'], $this->bearer(['read']))
            ->assertForbidden();
        $this->assertSame(0, Lead::count());
    }

    public function test_create_validates_like_the_app_and_defaults_the_owner()
    {
        $headers = $this->bearer();

        $this->postJson(route('api.v1.leads.store'), ['first_name' => 'Aina', 'status' => 'converted'], $headers)
            ->assertUnprocessable()->assertJsonValidationErrors(['last_name', 'status']);

        $this->postJson(route('api.v1.leads.store'), ['first_name' => 'Aina', 'last_name' => 'Rahman', 'status' => 'new', 'email' => 'aina@example.com'], $headers)
            ->assertCreated()->assertJsonPath('data.owner_id', $this->rep->id)->assertJsonPath('data.full_name', 'Aina Rahman');

        $account = Account::factory()->for($this->rep, 'owner')->create();
        $this->postJson(route('api.v1.cases.store'), ['subject' => 'Tracker offline', 'account_id' => $account->id, 'priority' => 'urgent', 'status' => 'open'], $headers)
            ->assertCreated()->assertJsonPath('data.number', 'C-2026-0001')->assertJsonPath('data.priority', 'urgent');
    }

    public function test_patch_changes_only_what_is_sent_and_delete_removes()
    {
        $lead = Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Aina', 'last_name' => 'Rahman', 'status' => 'new']);
        $headers = $this->bearer();

        $this->patchJson(route('api.v1.leads.update', $lead), ['status' => 'qualified'], $headers)
            ->assertOk()->assertJsonPath('data.status', 'qualified')->assertJsonPath('data.last_name', 'Rahman');

        $this->deleteJson(route('api.v1.leads.destroy', $lead), [], $headers)->assertNoContent();
        $this->assertSoftDeleted($lead);

        $case = SupportCase::factory()->create();
        $this->patchJson(route('api.v1.cases.update', $case), ['status' => 'closed'], $headers)->assertNotFound();
    }

    public function test_users_create_and_revoke_only_their_own_tokens()
    {
        $this->actingAs($this->rep)->post(route('api-tokens.store'), ['name' => 'Sync', 'access' => 'read'])
            ->assertSessionHas('inertia.flash_data.newToken');
        $token = $this->rep->tokens()->sole();
        $this->assertSame(['read'], $token->abilities);

        $other = $this->userWithRole(UserRole::SalesRep)->createToken('theirs')->accessToken;
        $this->actingAs($this->rep)->delete(route('api-tokens.destroy', $other->id))->assertNotFound();
        $this->actingAs($this->rep)->delete(route('api-tokens.destroy', $token->id))->assertRedirect();
        $this->assertSame(0, $this->rep->tokens()->count());
    }
}
