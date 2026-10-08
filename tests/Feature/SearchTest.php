<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Stage;
use App\Models\SupportCase;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class SearchTest extends TestCase
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

    /**
     * @return list<string>
     */
    private function titles(string $q, ?User $as = null): array
    {
        return collect($this->actingAs($as ?? $this->rep)->getJson(route('search', ['q' => $q]))->assertOk()->json('results'))
            ->map(fn (array $r) => "{$r['type']}:{$r['title']}")->all();
    }

    public function test_it_finds_every_record_type_by_name()
    {
        Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Aina', 'last_name' => 'Teraju']);
        Contact::factory()->for($this->rep, 'owner')->create(['first_name' => 'Hafiz', 'last_name' => 'Teraju']);
        Account::factory()->for($this->rep, 'owner')->create(['name' => 'Teraju Logistics']);
        Deal::factory()->for($this->rep, 'owner')->create(['name' => 'Teraju fleet', 'stage_id' => Stage::factory()]);
        $case = SupportCase::factory()->for($this->rep, 'owner')->create(['subject' => 'Teraju tracker offline']);
        Contract::factory()->for($this->rep, 'owner')->create(['name' => 'Teraju support']);

        $this->assertEqualsCanonicalizing(
            ['lead:Aina Teraju', 'contact:Hafiz Teraju', 'account:Teraju Logistics', 'deal:Teraju fleet', "case:{$case->number} Teraju tracker offline", 'contract:Teraju support'],
            $this->titles('teraju'),
        );
    }

    public function test_full_names_company_email_and_phone_digits_match()
    {
        Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Wilhelm', 'last_name' => 'Williamson', 'company' => 'Hyatt Group', 'email' => 'w@hyatt.example', 'phone' => '+1-463-881-4792']);

        foreach (['Wilhelm Williamson', 'hyatt group', 'w@hyatt', '4638814792', '881 4792'] as $q) {
            $this->assertSame(['lead:Wilhelm Williamson'], $this->titles($q), "query: {$q}");
        }
    }

    public function test_results_only_include_records_the_user_can_see()
    {
        Account::factory()->for($this->outsider, 'owner')->create(['name' => 'Hidden Sdn Bhd']);

        $this->assertSame([], $this->titles('Hidden'));
        $this->assertSame(['account:Hidden Sdn Bhd'], $this->titles('Hidden', $this->outsider));
    }

    public function test_queries_shorter_than_two_characters_return_nothing_and_wildcards_are_literal()
    {
        Account::factory()->for($this->rep, 'owner')->create(['name' => 'Anything']);

        $this->assertSame([], $this->titles('A'));
        $this->assertSame([], $this->titles('%%'));
    }

    public function test_guests_cannot_search()
    {
        $this->getJson(route('search', ['q' => 'abc']))->assertUnauthorized();
    }
}
