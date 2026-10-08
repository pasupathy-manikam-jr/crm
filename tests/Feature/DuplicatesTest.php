<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\FieldDefinition;
use App\Models\Lead;
use App\Models\Note;
use App\Models\Stage;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class DuplicatesTest extends TestCase
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

    private function account(array $attributes, ?User $owner = null): Account
    {
        return Account::factory()->for($owner ?? $this->rep, 'owner')->create(['email' => null, 'phone' => null, ...$attributes]);
    }

    public function test_groups_records_sharing_a_name_email_or_phone_but_only_visible_ones()
    {
        $this->account(['name' => 'Teraju Logistics Sdn Bhd']);
        $this->account(['name' => 'TERAJU LOGISTICS']);
        $this->account(['name' => 'Kelana', 'phone' => '+60 3-2141 8890']);
        $this->account(['name' => 'Kelana Cold Chain', 'phone' => '03 2141 8890']);
        $this->account(['name' => 'Unrelated Co']);
        $this->account(['name' => 'Teraju Logistics Ltd'], $this->outsider);

        $this->actingAs($this->rep)->get(route('duplicates.index', 'accounts'))->assertInertia(fn (Assert $page) => $page
            ->has('groups', 2)
            ->where('groups.0', fn ($g) => collect($g)->pluck('name')->sort()->values()->all() === ['TERAJU LOGISTICS', 'Teraju Logistics Sdn Bhd'])
            ->where('groups.1', fn ($g) => count($g) === 2));
    }

    public function test_merging_keeps_chosen_values_moves_everything_and_deletes_the_others()
    {
        FieldDefinition::create(['entity' => 'account', 'key' => 'tier', 'label' => 'Tier', 'type' => 'text', 'position' => 1]);
        $keep = $this->account(['name' => 'Teraju', 'phone' => null]);
        $dupe = $this->account(['name' => 'Teraju Sdn Bhd', 'phone' => '03-1111 2222', 'custom_fields' => ['tier' => 'Gold']]);
        $contact = Contact::factory()->for($this->rep, 'owner')->for($dupe)->create();
        $deal = Deal::factory()->for($this->rep, 'owner')->for($dupe)->create(['stage_id' => Stage::factory()]);
        Note::factory()->for($this->rep, 'author')->create(['notable_type' => 'account', 'notable_id' => $dupe->id]);
        Activity::factory()->for($this->rep, 'owner')->create(['regarding_type' => 'account', 'regarding_id' => $dupe->id]);

        $this->actingAs($this->rep)->post(route('duplicates.merge', 'accounts'), [
            'survivor_id' => $keep->id,
            'ids' => [$keep->id, $dupe->id],
            'values' => ['name' => $keep->id, 'phone' => $dupe->id],
        ])->assertRedirect(route('accounts.show', $keep));

        $keep->refresh();
        $this->assertSame(['Teraju', '03-1111 2222', 'Gold'], [$keep->name, $keep->phone, $keep->custom_fields['tier']]);
        $this->assertSoftDeleted($dupe);
        $this->assertSame($keep->id, $contact->fresh()->account_id);
        $this->assertSame($keep->id, $deal->fresh()->account_id);
        $this->assertSame(1, $keep->notes()->count());
        $this->assertSame(1, $keep->activities()->count());
        $this->assertSame('merged', $keep->auditLogs()->latest('id')->value('event'));
    }

    public function test_merges_need_visible_records_and_refuse_converted_leads()
    {
        $mine = $this->account(['name' => 'A']);
        $theirs = $this->account(['name' => 'B'], $this->outsider);
        $this->actingAs($this->rep)->post(route('duplicates.merge', 'accounts'), ['survivor_id' => $mine->id, 'ids' => [$mine->id, $theirs->id]])
            ->assertSessionHasErrors(['merge' => 'Choose two or more records you can see, including the one to keep.']);
        $this->assertNotSoftDeleted($theirs);

        $a = Lead::factory()->for($this->rep, 'owner')->create();
        $b = Lead::factory()->for($this->rep, 'owner')->create(['converted_at' => now()]);
        $this->actingAs($this->rep)->post(route('duplicates.merge', 'leads'), ['survivor_id' => $a->id, 'ids' => [$a->id, $b->id]])
            ->assertSessionHasErrors(['merge' => 'Converted leads can’t be merged.']);
    }

    public function test_creating_a_likely_duplicate_warns()
    {
        $this->account(['name' => 'Teraju Logistics']);

        $this->actingAs($this->rep)->post(route('accounts.store'), ['name' => 'Teraju Logistics Sdn Bhd', 'owner_id' => $this->rep->id])
            ->assertSessionHas('inertia.flash_data.toast.type', 'warning');
    }
}
