<?php

namespace Tests\Feature;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class CrmRecordsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $manager;

    private User $rep;

    private User $outsider;

    protected function setUp(): void
    {
        parent::setUp();

        $team = Team::factory()->create();
        $this->manager = $this->userWithRole(UserRole::SalesManager, $team);
        $this->rep = $this->userWithRole(UserRole::SalesRep, $team);
        $this->outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
    }

    /**
     * @return list<string>
     */
    private function listedAccountNames(User $viewer): array
    {
        $names = [];
        $this->actingAs($viewer)->get(route('accounts.index'))->assertInertia(
            function (Assert $page) use (&$names) {
                $names = array_column($page->toArray()['props']['accounts']['data'], 'name');
            },
        );
        sort($names);

        return $names;
    }

    public function test_each_role_lists_only_the_records_it_may_see()
    {
        Account::factory()->for($this->manager, 'owner')->create(['name' => 'Manager Co']);
        Account::factory()->for($this->rep, 'owner')->create(['name' => 'Rep Co']);
        Account::factory()->for($this->outsider, 'owner')->create(['name' => 'Outsider Co']);

        $this->assertSame(['Manager Co', 'Outsider Co', 'Rep Co'], $this->listedAccountNames($this->userWithRole(UserRole::Admin)));
        $this->assertSame(['Manager Co', 'Rep Co'], $this->listedAccountNames($this->manager));
        $this->assertSame(['Rep Co'], $this->listedAccountNames($this->rep));
    }

    public function test_records_outside_a_users_view_are_not_found()
    {
        $account = Account::factory()->for($this->outsider, 'owner')->create();
        $lead = Lead::factory()->for($this->outsider, 'owner')->create();

        $this->actingAs($this->rep)->get(route('accounts.show', $account))->assertNotFound();
        $this->actingAs($this->rep)->put(route('leads.update', $lead), ['first_name' => 'X'])->assertNotFound();
        $this->actingAs($this->rep)->delete(route('accounts.destroy', $account))->assertNotFound();
        $this->assertNotSoftDeleted($account);
    }

    public function test_guests_are_sent_to_login()
    {
        $this->get(route('contacts.index'))->assertRedirect(route('login'));
    }

    public function test_adding_an_account_saves_it_and_opens_its_page()
    {
        $this->actingAs($this->rep)
            ->post(route('accounts.store'), [
                'name' => 'Teraju Logistics Sdn Bhd',
                'website' => 'https://teraju.example',
                'owner_id' => $this->rep->id,
            ])
            ->assertRedirect(route('accounts.show', Account::firstWhere('name', 'Teraju Logistics Sdn Bhd')));

        $this->assertDatabaseHas('accounts', ['name' => 'Teraju Logistics Sdn Bhd', 'owner_id' => $this->rep->id]);
    }

    public function test_required_fields_are_reported_for_each_record_type()
    {
        $this->actingAs($this->rep);

        $this->post(route('accounts.store'), [])->assertSessionHasErrors([
            'name' => 'The name field is required.',
            'owner_id' => 'The owner id field is required.',
        ]);
        $this->post(route('contacts.store'), [])->assertSessionHasErrors(['first_name', 'last_name', 'owner_id']);
        $this->post(route('leads.store'), [])->assertSessionHasErrors(['first_name', 'last_name', 'status', 'owner_id']);
    }

    public function test_a_rep_cannot_hand_a_record_to_another_team()
    {
        $this->actingAs($this->rep)
            ->post(route('accounts.store'), ['name' => 'Acme', 'owner_id' => $this->outsider->id])
            ->assertSessionHasErrors(['owner_id' => 'The selected owner id is invalid.']);
    }

    public function test_a_contact_can_only_be_linked_to_a_visible_account()
    {
        $hidden = Account::factory()->for($this->outsider, 'owner')->create();

        $this->actingAs($this->rep)
            ->post(route('contacts.store'), [
                'first_name' => 'Aina',
                'last_name' => 'Zakaria',
                'account_id' => $hidden->id,
                'owner_id' => $this->rep->id,
            ])
            ->assertSessionHasErrors(['account_id' => 'Choose one of your accounts.']);
    }

    public function test_lists_search_filter_and_ignore_unknown_sort_columns()
    {
        Lead::factory()->for($this->rep, 'owner')->create(['last_name' => 'Tan', 'status' => LeadStatus::Qualified]);
        Lead::factory()->for($this->rep, 'owner')->create(['last_name' => 'Lim', 'status' => LeadStatus::New]);

        $this->actingAs($this->rep)
            ->get(route('leads.index', ['status' => 'qualified', 'sort' => 'password']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('leads.data', 1)
                ->where('leads.data.0.last_name', 'Tan')
                ->where('filters.sort', 'created_at')
                ->where('filters.direction', 'desc'));

        $this->actingAs($this->rep)
            ->get(route('leads.index', ['search' => 'Lim']))
            ->assertInertia(fn (Assert $page) => $page->has('leads.data', 1)->where('leads.data.0.last_name', 'Lim'));
    }

    public function test_deleting_an_account_keeps_its_contacts_without_an_account()
    {
        $account = Account::factory()->for($this->rep, 'owner')->create();
        $contact = Contact::factory()->for($this->rep, 'owner')->for($account)->create();

        $this->actingAs($this->rep)->delete(route('accounts.destroy', $account))->assertRedirect(route('accounts.index'));

        $this->assertSoftDeleted($account);
        $this->assertNull($contact->fresh()->account_id);
    }

    public function test_a_user_who_owns_records_cannot_be_deleted()
    {
        Lead::factory()->for($this->rep, 'owner')->create()->delete();

        $this->actingAs($this->userWithRole(UserRole::Admin))->delete(route('users.destroy', $this->rep));

        $this->assertModelExists($this->rep);
    }
}
