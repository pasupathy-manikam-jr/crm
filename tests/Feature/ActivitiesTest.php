<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Activity;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class ActivitiesTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $manager;

    private User $rep;

    private User $outsider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-07 10:00'));
        $team = Team::factory()->create();
        $this->manager = $this->userWithRole(UserRole::SalesManager, $team);
        $this->rep = $this->userWithRole(UserRole::SalesRep, $team);
        $this->outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
    }

    private function activity(User $owner, ?string $due, ?string $done = null): Activity
    {
        return Activity::factory()->for($owner, 'owner')->create(['due_at' => $due, 'done_at' => $done]);
    }

    public function test_tabs_sort_my_activities_into_overdue_today_upcoming_no_date_and_done()
    {
        $this->activity($this->rep, '2026-10-05 09:00');
        $this->activity($this->rep, '2026-10-07 16:00');
        $this->activity($this->rep, '2026-10-07 08:00');
        $this->activity($this->rep, '2026-10-09 09:00');
        $this->activity($this->rep, null);
        $this->activity($this->rep, '2026-10-01 09:00', '2026-10-02 09:00');
        $this->activity($this->manager, '2026-10-07 11:00');

        $this->actingAs($this->rep)->get(route('activities.index'))->assertInertia(fn (Assert $page) => $page
            ->where('filters.tab', 'today')
            ->has('activities.data', 2)
            ->where('counts', ['overdue' => 1, 'today' => 2, 'upcoming' => 1, 'unscheduled' => 1, 'done' => 1]));
    }

    public function test_a_manager_can_see_the_teams_activities_but_not_other_teams()
    {
        $this->activity($this->manager, '2026-10-07 11:00');
        $this->activity($this->rep, '2026-10-07 12:00');
        $this->activity($this->outsider, '2026-10-07 13:00');

        $this->actingAs($this->manager)->get(route('activities.index', ['owner' => 'everyone']))
            ->assertInertia(fn (Assert $page) => $page->where('counts.today', 2)->where('filters.owner', 'everyone'));
    }

    public function test_ticking_an_activity_marks_it_done_and_ticking_again_reopens_it()
    {
        $activity = $this->activity($this->rep, '2026-10-07 16:00');

        $this->actingAs($this->rep)->patch(route('activities.done', $activity))->assertRedirect();
        $this->assertNotNull($activity->fresh()->done_at);

        $this->actingAs($this->rep)->patch(route('activities.done', $activity));
        $this->assertNull($activity->fresh()->done_at);
    }

    public function test_another_teams_activity_is_not_found()
    {
        $activity = $this->activity($this->outsider, '2026-10-07 16:00');

        $this->actingAs($this->rep)->patch(route('activities.done', $activity))->assertNotFound();
        $this->assertNull($activity->fresh()->done_at);
    }

    public function test_logging_against_a_record_requires_one_the_user_can_see()
    {
        $mine = Account::factory()->for($this->rep, 'owner')->create();
        $hidden = Account::factory()->for($this->outsider, 'owner')->create();
        $input = ['type' => 'call', 'subject' => 'Discovery call', 'owner_id' => $this->rep->id, 'regarding_type' => 'account'];

        $this->actingAs($this->rep)->post(route('activities.store'), [...$input, 'regarding_id' => $hidden->id])
            ->assertSessionHasErrors(['regarding_id' => 'Choose a record you can see.']);
        $this->actingAs($this->rep)->post(route('activities.store'), [...$input, 'regarding_type' => 'invoice', 'regarding_id' => 1])
            ->assertSessionHasErrors('regarding_type');

        $this->actingAs($this->rep)->post(route('activities.store'), [...$input, 'regarding_id' => $mine->id])->assertSessionHasNoErrors();
        $this->assertSame(1, $mine->activities()->count());
        $this->assertSame('account', $mine->activities()->first()->regarding_type);
    }

    public function test_the_top_bar_counts_my_open_activities_due_today_or_overdue()
    {
        $this->activity($this->rep, '2026-10-05 09:00');
        $this->activity($this->rep, '2026-10-07 18:00');
        $this->activity($this->rep, '2026-10-08 09:00');
        $this->activity($this->rep, '2026-10-06 09:00', '2026-10-06 10:00');

        $this->actingAs($this->rep)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->where('auth.dueActivities', 2));
    }

    public function test_a_record_page_lists_its_activities()
    {
        $account = Account::factory()->for($this->rep, 'owner')->create();
        Activity::factory()->for($this->rep, 'owner')->create(['regarding_type' => 'account', 'regarding_id' => $account->id, 'subject' => 'Site visit']);

        $this->actingAs($this->rep)->get(route('accounts.show', $account))
            ->assertInertia(fn (Assert $page) => $page->has('activities', 1)->where('activities.0.subject', 'Site visit')->has('activityTypes', 4));
    }

    public function test_the_calendar_shows_whole_weeks_of_the_month_for_the_chosen_owner()
    {
        // October 2026 runs Thursday 1st to Saturday 31st, so the grid is Mon 28 Sep to Sun 1 Nov.
        $edge = $this->activity($this->rep, '2026-09-28 09:00');
        $mid = $this->activity($this->rep, '2026-10-15 14:00');
        $this->activity($this->rep, '2026-11-02 09:00');
        $this->activity($this->rep, null);
        $managers = $this->activity($this->manager, '2026-10-15 09:00');

        $ids = fn (array $query, User $as) => collect($this->actingAs($as)->get(route('activities.calendar', $query))
            ->assertInertia(fn (Assert $page) => $page->component('activities/calendar'))
            ->inertiaProps('activities'))->pluck('id')->all();

        $this->assertSame([$edge->id, $mid->id], $ids(['month' => '2026-10'], $this->rep));
        $this->assertSame([$edge->id, $managers->id, $mid->id], $ids(['month' => '2026-10', 'owner' => 'everyone'], $this->manager));
        $this->assertSame([], $ids(['month' => '2026-10', 'owner' => 'everyone'], $this->outsider));
        // A bad month falls back to this one.
        $this->assertSame([$edge->id, $mid->id], $ids(['month' => '2026-13'], $this->rep));
    }

    public function test_rescheduling_moves_the_day_and_keeps_the_time()
    {
        $timed = $this->activity($this->rep, '2026-10-15 14:30');
        $untimed = $this->activity($this->rep, null);

        $this->actingAs($this->rep)->patch(route('activities.reschedule', $timed), ['date' => '2026-10-20'])->assertRedirect();
        $this->actingAs($this->rep)->patch(route('activities.reschedule', $untimed), ['date' => '2026-10-21']);
        $this->actingAs($this->rep)->patch(route('activities.reschedule', $timed), ['date' => 'tomorrow'])->assertSessionHasErrors('date');

        $this->assertEquals(Carbon::parse('2026-10-20 14:30'), $timed->fresh()?->due_at);
        $this->assertEquals(Carbon::parse('2026-10-21 09:00'), $untimed->fresh()?->due_at);
        $this->actingAs($this->outsider)->patch(route('activities.reschedule', $timed), ['date' => '2026-10-22'])->assertNotFound();
    }
}
