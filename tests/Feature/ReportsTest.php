<?php

namespace Tests\Feature;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Stage;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    private User $outsider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $this->outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
    }

    public function test_deals_sum_by_stage_with_names_and_only_visible_records()
    {
        $proposal = Stage::factory()->create(['name' => 'Proposal', 'position' => 1, 'probability' => 50]);
        $won = Stage::factory()->create(['name' => 'Won', 'position' => 2, 'probability' => 100]);
        Deal::factory()->for($this->rep, 'owner')->create(['stage_id' => $proposal->id, 'amount' => 1000]);
        Deal::factory()->for($this->rep, 'owner')->create(['stage_id' => $proposal->id, 'amount' => 500]);
        Deal::factory()->for($this->rep, 'owner')->create(['stage_id' => $won->id, 'amount' => 4000]);
        Deal::factory()->for($this->outsider, 'owner')->create(['stage_id' => $won->id, 'amount' => 99999]);

        $this->actingAs($this->rep)->get(route('reports.index', ['module' => 'deals', 'group' => 'stage', 'measure' => 'amount']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('rows', [['label' => 'Won', 'value' => 4000], ['label' => 'Proposal', 'value' => 1500]])
                ->where('total', 5500));
    }

    public function test_leads_count_by_status_respect_the_date_range_and_unknown_options_fall_back()
    {
        Lead::factory()->for($this->rep, 'owner')->create(['status' => LeadStatus::New, 'created_at' => '2026-09-10']);
        Lead::factory()->for($this->rep, 'owner')->create(['status' => LeadStatus::New, 'created_at' => '2026-10-02']);
        Lead::factory()->for($this->rep, 'owner')->create(['status' => LeadStatus::Lost, 'created_at' => '2026-10-03']);

        $this->actingAs($this->rep)->get(route('reports.index', ['module' => 'leads', 'group' => 'status', 'from' => '2026-10-01', 'to' => '2026-10-31']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 2)->has('rows', 2));

        $this->actingAs($this->rep)->get(route('reports.index', ['module' => 'nope', 'group' => '1;drop', 'measure' => 'x']))
            ->assertInertia(fn (Assert $page) => $page->where('filters.module', 'deals')->where('filters.group', 'stage'));
    }

    public function test_reports_export_as_csv()
    {
        Lead::factory()->for($this->rep, 'owner')->create(['status' => LeadStatus::Qualified]);

        $csv = $this->actingAs($this->rep)->get(route('reports.index', ['module' => 'leads', 'group' => 'status', 'format' => 'csv']))
            ->assertOk()->streamedContent();

        $this->assertSame("Status,\"Number of leads\"\nQualified,1\n", $csv);
    }
}
