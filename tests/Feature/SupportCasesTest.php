<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Holiday;
use App\Models\SupportCase;
use App\Models\Team;
use App\Models\User;
use App\Notifications\CaseEscalated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class SupportCasesTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private Team $team;

    private User $rep;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-08 10:00'));
        $this->team = Team::factory()->create();
        $this->rep = $this->userWithRole(UserRole::SalesRep, $this->team);
    }

    public function test_a_case_is_numbered_and_its_sla_set_from_priority()
    {
        $account = Account::factory()->for($this->rep, 'owner')->create();

        $this->actingAs($this->rep)->post(route('cases.store'), [
            'subject' => 'Tracker offline',
            'account_id' => $account->id,
            'contact_id' => 'none',
            'priority' => 'urgent',
            'status' => 'open',
            'owner_id' => $this->rep->id,
        ])->assertSessionHasNoErrors();

        $case = SupportCase::firstOrFail();
        $this->assertSame('C-2026-0001', $case->number);
        $this->assertEquals(Carbon::parse('2026-10-08 14:00'), $case->sla_due_at);

        // A new priority moves the deadline, still counted from opening.
        $this->travel(1)->hours();
        $case->update(['priority' => 'high']);
        $this->assertEquals(Carbon::parse('2026-10-09 10:00'), $case->fresh()?->sla_due_at);
    }

    public function test_resolving_stamps_the_time_and_reopening_clears_it()
    {
        $case = SupportCase::factory()->for($this->rep, 'owner')->create();

        $this->actingAs($this->rep)->patch(route('cases.status', $case), ['status' => 'resolved'])->assertRedirect();
        $this->assertEquals(now(), $case->fresh()?->resolved_at);

        $this->actingAs($this->rep)->patch(route('cases.status', $case), ['status' => 'open']);
        $this->assertNull($case->fresh()?->resolved_at);
    }

    public function test_the_list_hides_resolved_cases_and_can_show_only_breached_ones()
    {
        $late = SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'urgent', 'created_at' => now()->subDay()]);
        $fine = SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'low']);
        SupportCase::factory()->for($this->rep, 'owner')->create(['status' => 'resolved']);
        SupportCase::factory()->create(['priority' => 'urgent', 'created_at' => now()->subDay()]);

        $this->actingAs($this->rep)->get(route('cases.index'))
            ->assertInertia(fn (Assert $page) => $page->component('cases/index')
                ->where('cases.data.0.id', $late->id)
                ->where('cases.data.1.id', $fine->id)
                ->has('cases.data', 2)
                ->where('auth.breachedCases', 1));

        $this->actingAs($this->rep)->get(route('cases.index', ['status' => 'breached']))
            ->assertInertia(fn (Assert $page) => $page->has('cases.data', 1)->where('cases.data.0.id', $late->id));
    }

    public function test_another_teams_case_is_not_found()
    {
        $case = SupportCase::factory()->create();

        $this->actingAs($this->rep)->get(route('cases.show', $case))->assertNotFound();
    }

    public function test_breached_cases_are_escalated_once_to_the_owner_and_team_managers()
    {
        Notification::fake();
        $manager = $this->userWithRole(UserRole::SalesManager, $this->team);
        $otherManager = $this->userWithRole(UserRole::SalesManager, Team::factory()->create());
        $late = SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'urgent', 'created_at' => now()->subDay()]);
        SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'urgent', 'created_at' => now()->subDay(), 'status' => 'resolved']);
        SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'urgent']);

        $this->artisan('cases:escalate')->expectsOutput('Escalated 1 case(s).')->assertSuccessful();
        $this->artisan('cases:escalate')->expectsOutput('Escalated 0 case(s).');

        $this->assertEquals(now(), $late->fresh()?->escalated_at);
        Notification::assertSentTo([$this->rep, $manager], CaseEscalated::class, fn (CaseEscalated $n) => $n->case->is($late));
        Notification::assertNotSentTo($otherManager, CaseEscalated::class);
        Notification::assertCount(2);
    }

    public function test_an_accounts_page_lists_its_cases_and_new_case_links_prefill_it()
    {
        $account = Account::factory()->for($this->rep, 'owner')->create();
        $case = SupportCase::factory()->for($this->rep, 'owner')->for($account)->create();
        SupportCase::factory()->for($this->rep, 'owner')->create();

        $this->actingAs($this->rep)->get(route('accounts.show', $account))
            ->assertInertia(fn (Assert $page) => $page->has('account.support_cases', 1)->where('account.support_cases.0.id', $case->id));

        $this->actingAs($this->rep)->get(route('cases.index', ['new' => 1, 'account' => $account->id]))
            ->assertInertia(fn (Assert $page) => $page->where('prefill', ['account_id' => $account->id, 'contact_id' => null]));
        $this->actingAs($this->rep)->get(route('cases.index'))->assertInertia(fn (Assert $page) => $page->where('prefill', null));
    }

    public function test_the_sla_counts_working_hours_and_skips_weekends_and_holidays()
    {
        Holiday::create(['date' => '2026-10-12', 'name' => 'Company day']);

        // Friday 16:00, high = one working day (9h): 2h Friday, Monday is a holiday, 7h Tuesday.
        $this->travelTo(Carbon::parse('2026-10-09 16:00'));
        $case = SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'high']);
        $this->assertEquals(Carbon::parse('2026-10-13 16:00'), $case->sla_due_at);

        // Opened Saturday night: the clock starts Tuesday 9:00 (Monday off).
        $this->travelTo(Carbon::parse('2026-10-10 22:00'));
        $case = SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'urgent']);
        $this->assertEquals(Carbon::parse('2026-10-13 13:00'), $case->sla_due_at);

        config(['app.business_hours.enabled' => false]);
        $case = SupportCase::factory()->for($this->rep, 'owner')->create(['priority' => 'normal']);
        $this->assertEquals(Carbon::parse('2026-10-13 22:00'), $case->sla_due_at);
    }

    public function test_only_admins_manage_holidays()
    {
        $admin = $this->userWithRole(UserRole::Admin);

        $this->actingAs($this->rep)->post(route('holidays.store'), ['date' => '2026-08-31', 'name' => 'Merdeka'])->assertForbidden();
        $this->actingAs($admin)->post(route('holidays.store'), ['date' => '2026-08-31', 'name' => 'Merdeka'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->post(route('holidays.store'), ['date' => '2026-08-31', 'name' => 'Again'])->assertSessionHasErrors('date');
        $this->assertSame('Merdeka', Holiday::sole()->name);
    }
}
