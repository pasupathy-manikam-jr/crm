<?php

namespace Tests\Feature;

use App\Enums\ContractStatus;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Activity;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\Stage;
use App\Models\Team;
use App\Models\User;
use App\Notifications\ContractRenewalDue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class ContractsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-08 10:00'));
        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $this->account = Account::factory()->for($this->rep, 'owner')->create();
    }

    public function test_a_contract_is_validated_and_saved()
    {
        $input = [
            'name' => 'Fleet subscription 2026',
            'account_id' => $this->account->id,
            'contact_id' => 'none',
            'quote_id' => 'none',
            'status' => 'active',
            'start_date' => '2026-01-01',
            'end_date' => '2025-12-31',
            'value' => '12000',
            'notice_days' => '45',
            'owner_id' => $this->rep->id,
        ];

        $this->actingAs($this->rep)->post(route('contracts.store'), $input)->assertSessionHasErrors('end_date');
        $this->actingAs($this->rep)->post(route('contracts.store'), [...$input, 'account_id' => Account::factory()->create()->id])->assertSessionHasErrors('account_id');

        $this->actingAs($this->rep)->post(route('contracts.store'), [...$input, 'end_date' => '2026-12-31'])->assertSessionHasNoErrors();
        $contract = Contract::sole();
        $this->assertSame(['2026-12-31', '12000.00', 45, null], [$contract->end_date->toDateString(), $contract->value, $contract->notice_days, $contract->quote_id]);
    }

    public function test_the_reminder_fires_once_inside_the_notice_window_and_ended_contracts_expire()
    {
        Notification::fake();
        $due = Contract::factory()->for($this->rep, 'owner')->for($this->account)->create(['end_date' => '2026-10-30', 'notice_days' => 30]);
        $later = Contract::factory()->for($this->rep, 'owner')->for($this->account)->create(['end_date' => '2026-12-31', 'notice_days' => 30]);
        $ended = Contract::factory()->for($this->rep, 'owner')->for($this->account)->create(['end_date' => '2026-10-01']);
        Contract::factory()->for($this->rep, 'owner')->for($this->account)->create(['end_date' => '2026-10-20', 'status' => 'cancelled']);

        $this->artisan('contracts:remind')->expectsOutput('Reminded 2, expired 1 contract(s).');
        $this->artisan('contracts:remind')->expectsOutput('Reminded 0, expired 0 contract(s).');

        Notification::assertSentTo($this->rep, ContractRenewalDue::class, fn (ContractRenewalDue $n) => $n->contract->is($due));
        Notification::assertSentTimes(ContractRenewalDue::class, 2);
        $task = Activity::where('regarding_id', $due->id)->sole();
        $this->assertSame('Renew '.$due->name, $task->subject);
        $this->assertEquals(Carbon::parse('2026-10-23 09:00'), $task->due_at);
        $this->assertNull($later->fresh()?->reminded_at);
        $this->assertSame(ContractStatus::Expired, $ended->fresh()?->status);

        // Moving the end date re-arms the reminder.
        $due->refresh()->update(['end_date' => '2027-10-30']);
        $this->assertNull($due->fresh()?->reminded_at);
    }

    public function test_renewing_opens_a_deal_once()
    {
        Stage::factory()->create(['kind' => 'open', 'position' => 1]);
        $contract = Contract::factory()->for($this->rep, 'owner')->for($this->account)->create(['value' => 5000, 'end_date' => '2026-11-30']);

        $this->actingAs($this->rep)->post(route('contracts.renew', $contract))->assertRedirect(route('deals.show', Deal::sole()));

        $deal = Deal::sole();
        $this->assertSame(["Renewal: {$contract->name}", '5000.00', $this->account->id, '2026-11-30'], [$deal->name, $deal->amount, $deal->account_id, $deal->expected_close_date?->toDateString()]);
        $this->assertSame([ContractStatus::Renewed, $deal->id], [$contract->fresh()?->status, $contract->fresh()?->renewal_deal_id]);
        $this->actingAs($this->rep)->post(route('contracts.renew', $contract))->assertStatus(409);
    }

    public function test_another_teams_contract_is_not_found()
    {
        $contract = Contract::factory()->create();

        $this->actingAs($this->rep)->get(route('contracts.show', $contract))->assertNotFound();
        $this->actingAs($this->rep)->post(route('contracts.renew', $contract))->assertNotFound();
    }
}
