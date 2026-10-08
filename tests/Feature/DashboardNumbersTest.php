<?php

namespace Tests\Feature;

use App\Enums\StageKind;
use App\Enums\UserRole;
use App\Models\Deal;
use App\Models\Stage;
use App\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class DashboardNumbersTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    public function test_the_dashboard_sums_only_the_users_visible_pipeline()
    {
        $this->travelTo(Carbon::parse('2026-10-15 10:00'));
        $rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $proposal = Stage::factory()->create(['name' => 'Proposal', 'position' => 1, 'probability' => 50]);
        $won = Stage::factory()->create(['name' => 'Won', 'position' => 2, 'probability' => 100, 'kind' => StageKind::Won]);
        $lost = Stage::factory()->create(['name' => 'Lost', 'position' => 3, 'probability' => 0, 'kind' => StageKind::Lost]);

        Deal::factory()->for($rep, 'owner')->create(['stage_id' => $proposal->id, 'amount' => 10000, 'expected_close_date' => '2026-10-20']);
        Deal::factory()->for($rep, 'owner')->create(['stage_id' => $won->id, 'amount' => 4000]);
        Deal::factory()->for($rep, 'owner')->create(['stage_id' => $lost->id, 'amount' => 999]);
        Deal::factory()->for($outsider, 'owner')->create(['stage_id' => $proposal->id, 'amount' => 777777]);

        $this->actingAs($rep)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('stats.openAmount', 10000)
            ->where('stats.openCount', 1)
            ->where('stats.weightedAmount', 5000)
            ->where('stats.wonAmount', 4000)
            ->where('stats.winRate', 50)
            ->where('byStage.0.amount', 10000)
            ->has('closingSoon', 1));
    }
}
