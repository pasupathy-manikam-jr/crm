<?php

namespace Tests\Feature;

use App\Enums\LeadStatus;
use App\Enums\StageKind;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Stage;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class DealsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    private User $outsider;

    private Stage $proposal;

    private Stage $won;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $this->outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $this->proposal = Stage::factory()->create(['name' => 'Proposal', 'position' => 1, 'probability' => 50]);
        $this->won = Stage::factory()->create(['name' => 'Won', 'position' => 2, 'probability' => 100, 'kind' => StageKind::Won]);
    }

    public function test_moving_a_deal_takes_the_stage_probability_and_closes_it_when_won()
    {
        $deal = Deal::factory()->for($this->rep, 'owner')->create(['stage_id' => $this->proposal->id]);
        $this->assertSame(50, $deal->probability);

        $this->actingAs($this->rep)->patch(route('deals.stage', $deal), ['stage_id' => $this->won->id])->assertRedirect();
        $deal->refresh();
        $this->assertSame(100, $deal->probability);
        $this->assertNotNull($deal->closed_at);

        $this->actingAs($this->rep)->patch(route('deals.stage', $deal), ['stage_id' => $this->proposal->id]);
        $this->assertNull($deal->fresh()->closed_at);
    }

    public function test_another_teams_deal_cannot_be_moved()
    {
        $deal = Deal::factory()->for($this->outsider, 'owner')->create(['stage_id' => $this->proposal->id]);

        $this->actingAs($this->rep)->patch(route('deals.stage', $deal), ['stage_id' => $this->won->id])->assertNotFound();
        $this->assertSame($this->proposal->id, $deal->fresh()->stage_id);
    }

    public function test_a_deal_needs_a_name_amount_and_stage_and_only_visible_accounts()
    {
        $hidden = Account::factory()->for($this->outsider, 'owner')->create();

        $this->actingAs($this->rep)
            ->post(route('deals.store'), ['account_id' => $hidden->id, 'owner_id' => $this->rep->id])
            ->assertSessionHasErrors([
                'name' => 'The name field is required.',
                'amount' => 'The amount field is required.',
                'stage_id' => 'The stage id field is required.',
                'account_id' => 'Choose one of your accounts.',
            ]);
    }

    public function test_the_board_and_list_show_the_users_deals()
    {
        Deal::factory()->for($this->rep, 'owner')->create(['stage_id' => $this->proposal->id, 'name' => 'Racking']);
        Deal::factory()->for($this->outsider, 'owner')->create(['stage_id' => $this->proposal->id]);

        $this->actingAs($this->rep)->get(route('deals.index'))->assertInertia(fn (Assert $page) => $page
            ->where('view', 'board')->has('deals', 1)->where('deals.0.name', 'Racking')->has('stages', 2));

        $this->actingAs($this->rep)->get(route('deals.index', ['view' => 'list']))->assertInertia(fn (Assert $page) => $page
            ->where('view', 'list')->has('deals.data', 1)->where('filters.view', 'list'));
    }

    public function test_converting_a_lead_creates_account_contact_and_deal_owned_by_the_lead_owner()
    {
        $lead = Lead::factory()->for($this->rep, 'owner')->create([
            'first_name' => 'Aina', 'last_name' => 'Zakaria', 'email' => 'aina@teraju.example', 'company' => 'Teraju', 'status' => LeadStatus::Qualified,
        ]);

        $this->actingAs($this->rep)
            ->post(route('leads.convert', $lead), [
                'account_mode' => 'new',
                'account_name' => 'Teraju Logistics',
                'create_deal' => 'on',
                'deal_name' => 'Fleet tracking',
                'deal_amount' => '48250.50',
                'stage_id' => $this->proposal->id,
            ])
            ->assertRedirect(route('deals.show', Deal::firstWhere('name', 'Fleet tracking')));

        $lead->refresh();
        $account = Account::firstWhere('name', 'Teraju Logistics');
        $contact = Contact::firstWhere('email', 'aina@teraju.example');
        $deal = Deal::firstWhere('name', 'Fleet tracking');

        $this->assertSame(LeadStatus::Converted, $lead->status);
        $this->assertSame([$account->id, $contact->id, $deal->id], [$lead->converted_account_id, $lead->converted_contact_id, $lead->converted_deal_id]);
        $this->assertSame('Aina', $contact->first_name);
        $this->assertSame($account->id, $contact->account_id);
        $this->assertSame([$this->rep->id, $this->rep->id, $this->rep->id], [$account->owner_id, $contact->owner_id, $deal->owner_id]);
        $this->assertSame('48250.50', $deal->amount);
        $this->assertSame(50, $deal->probability);
    }

    public function test_converting_into_an_existing_account_without_a_deal()
    {
        $account = Account::factory()->for($this->rep, 'owner')->create();
        $lead = Lead::factory()->for($this->rep, 'owner')->create();

        $this->actingAs($this->rep)
            ->post(route('leads.convert', $lead), ['account_mode' => 'existing', 'account_id' => $account->id])
            ->assertRedirect(route('accounts.show', $account));

        $this->assertSame(1, Account::count());
        $this->assertSame(0, Deal::count());
        $this->assertSame($account->id, $lead->fresh()->converted_account_id);
    }

    public function test_a_lead_cannot_be_converted_twice()
    {
        $lead = Lead::factory()->for($this->rep, 'owner')->create();
        $input = ['account_mode' => 'new', 'account_name' => 'Once Only Sdn Bhd'];

        $this->actingAs($this->rep)->post(route('leads.convert', $lead), $input);
        $this->actingAs($this->rep)->post(route('leads.convert', $lead), $input)->assertSessionHas('inertia.flash_data.toast.type', 'error');

        $this->assertSame(1, Contact::count());
        $this->assertSame(1, Account::count());
    }

    public function test_conversion_validates_the_chosen_options_and_hides_other_teams_leads()
    {
        $lead = Lead::factory()->for($this->rep, 'owner')->create();

        $this->actingAs($this->rep)
            ->post(route('leads.convert', $lead), ['account_mode' => 'new', 'create_deal' => 'on'])
            ->assertSessionHasErrors([
                'account_name' => 'The account name field is required.',
                'deal_name' => 'The deal name field is required.',
                'deal_amount' => 'The amount field is required.',
            ]);
        $this->assertNull($lead->fresh()->converted_at);

        $hidden = Lead::factory()->for($this->outsider, 'owner')->create();
        $this->actingAs($this->rep)->post(route('leads.convert', $hidden), ['account_mode' => 'new', 'account_name' => 'X'])->assertNotFound();
    }

    public function test_only_conversion_can_mark_a_lead_converted()
    {
        $lead = Lead::factory()->for($this->rep, 'owner')->create();

        $this->actingAs($this->rep)
            ->put(route('leads.update', $lead), [
                'first_name' => 'A', 'last_name' => 'B', 'status' => 'converted', 'owner_id' => $this->rep->id,
            ])
            ->assertSessionHasErrors('status');
    }
}
