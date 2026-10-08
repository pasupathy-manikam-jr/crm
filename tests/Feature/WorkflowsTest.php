<?php

namespace Tests\Feature;

use App\Enums\QuoteStatus;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\Team;
use App\Models\User;
use App\Models\WorkflowRule;
use App\Notifications\QuoteApproval;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class WorkflowsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private Team $team;

    private User $admin;

    private User $rep;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-08 10:00'));
        $this->team = Team::factory()->create();
        $this->admin = $this->userWithRole(UserRole::Admin);
        $this->rep = $this->userWithRole(UserRole::SalesRep, $this->team);
    }

    public function test_an_admin_saves_a_rule_and_invalid_actions_are_rejected()
    {
        $this->actingAs($this->admin)->post(route('workflows.store'), [
            'name' => 'Hot website leads',
            'module' => 'lead',
            'event' => 'created',
            'active' => '1',
            'conditions' => [['field' => 'source', 'operator' => 'equals', 'value' => 'website']],
            'actions' => [['type' => 'create_task', 'subject' => 'Call {first_name}', 'due_in_days' => '1']],
        ])->assertSessionHasNoErrors();

        $this->assertSame([['type' => 'create_task', 'subject' => 'Call {first_name}', 'due_in_days' => '1']], WorkflowRule::firstOrFail()->actions);

        $this->actingAs($this->admin)->post(route('workflows.store'), [
            'name' => 'Bad',
            'module' => 'quote',
            'event' => 'saved',
            'conditions' => [['field' => 'total', 'operator' => 'greater_than', 'value' => '']],
            'actions' => [['type' => 'create_task', 'subject' => 'x'], ['type' => 'set_field', 'field' => 'total', 'value' => '1']],
        ])->assertSessionHasErrors(['conditions.0.value', 'actions.0.type', 'actions.1.field']);

        $this->actingAs($this->rep)->get(route('workflows.index'))->assertForbidden();
    }

    public function test_a_matching_rule_sets_a_field_creates_a_task_and_emails()
    {
        Event::fake([MessageSent::class]);
        WorkflowRule::factory()->create([
            'module' => 'lead',
            'event' => 'created',
            'conditions' => [['field' => 'source', 'operator' => 'equals', 'value' => 'website']],
            'actions' => [
                ['type' => 'set_field', 'field' => 'status', 'value' => 'contacted'],
                ['type' => 'create_task', 'subject' => 'Call {first_name} at {company}', 'due_in_days' => '2'],
                ['type' => 'send_email', 'to' => 'owner', 'subject' => 'New lead {first_name}', 'body' => 'See {url}'],
            ],
        ]);

        $lead = Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Aina', 'company' => 'Acme', 'source' => 'website', 'status' => 'new']);
        Lead::factory()->for($this->rep, 'owner')->create(['source' => 'referral', 'status' => 'new']);

        $this->assertSame('contacted', $lead->fresh()?->status->value);
        $task = Activity::sole();
        $this->assertSame(['Call Aina at Acme', $this->rep->id, $lead->id], [$task->subject, $task->owner_id, $task->regarding_id]);
        $this->assertEquals(Carbon::parse('2026-10-10 09:00'), $task->due_at);
        Event::assertDispatched(MessageSent::class, fn (MessageSent $e) => $e->message->getTo()[0]->getAddress() === $this->rep->email
            && $e->message->getSubject() === 'New lead Aina'
            && str_contains($e->message->getTextBody() ?? '', route('leads.show', $lead)));
        $this->assertSame(1, WorkflowRule::sole()->runs_count);
    }

    public function test_changed_and_comparison_conditions_on_update()
    {
        WorkflowRule::factory()->create([
            'module' => 'deal',
            'event' => 'updated',
            'conditions' => [
                ['field' => 'amount', 'operator' => 'changed'],
                ['field' => 'amount', 'operator' => 'greater_than', 'value' => '50000'],
            ],
            'actions' => [['type' => 'create_task', 'subject' => 'Big deal: {name}']],
        ]);
        $deal = Deal::factory()->for($this->rep, 'owner')->create(['amount' => 1000]);

        $deal->update(['name' => 'Renamed']);
        $deal->update(['amount' => 9000]);
        $this->assertSame(0, Activity::count());

        $deal->update(['amount' => 60000]);
        $this->assertSame('Big deal: Renamed', Activity::sole()->subject);
    }

    public function test_a_discounted_quote_waits_for_a_team_manager_who_approves_or_rejects_it()
    {
        Notification::fake();
        $manager = $this->userWithRole(UserRole::SalesManager, $this->team);
        $otherManager = $this->userWithRole(UserRole::SalesManager, Team::factory()->create());
        WorkflowRule::factory()->create([
            'module' => 'quote',
            'event' => 'saved',
            'conditions' => [['field' => 'discount_percent', 'operator' => 'greater_than', 'value' => '15']],
            'actions' => [['type' => 'require_approval']],
        ]);
        $line = fn (string $discount) => ['owner_id' => $this->rep->id, 'items' => [['description' => 'Tracker', 'quantity' => '1', 'unit_price' => '1000', 'discount_percent' => $discount, 'tax_rate' => '0']]];

        // 10% passes straight through; 20% is locked for approval.
        $this->actingAs($this->rep)->post(route('quotes.store'), $line('10'));
        $this->assertSame(QuoteStatus::Draft, Quote::sole()->status);
        $this->actingAs($this->rep)->post(route('quotes.store'), $line('20'));
        $quote = Quote::latest('id')->firstOrFail();
        $this->assertSame(QuoteStatus::PendingApproval, $quote->status);
        Notification::assertSentTo([$manager, $this->admin], QuoteApproval::class);
        Notification::assertNotSentTo([$otherManager, $this->rep], QuoteApproval::class);

        // Locked: the owner can't edit or send it, and can't approve their own.
        $this->actingAs($this->rep)->put(route('quotes.update', $quote), $line('20'))->assertForbidden();
        $this->actingAs($this->rep)->patch(route('quotes.status', $quote), ['status' => 'sent'])->assertForbidden();
        $this->actingAs($this->rep)->post(route('quotes.approval', $quote), ['decision' => 'approved'])->assertForbidden();

        $this->actingAs($manager)->post(route('quotes.approval', $quote), ['decision' => 'rejected'])->assertSessionHasErrors('note');
        $this->actingAs($manager)->post(route('quotes.approval', $quote), ['decision' => 'rejected', 'note' => 'Max 15%']);
        $quote->refresh();
        $this->assertSame([QuoteStatus::Draft, 'rejected', 'Max 15%', $manager->id], [$quote->status, $quote->approval_decision, $quote->approval_note, $quote->approval_by]);
        Notification::assertSentTo($this->rep, QuoteApproval::class);

        // Editing clears the decision, so the rule looks again and locks it; this time it's approved and stays a draft.
        $this->actingAs($this->rep)->put(route('quotes.update', $quote), $line('18'));
        $this->assertSame(QuoteStatus::PendingApproval, $quote->fresh()?->status);
        $this->actingAs($manager)->post(route('quotes.approval', $quote), ['decision' => 'approved']);
        $this->actingAs($this->rep)->patch(route('quotes.status', $quote), ['status' => 'sent']);
        $this->assertSame([QuoteStatus::Sent, 'approved'], [$quote->fresh()?->status, $quote->fresh()?->approval_decision]);
    }
}
