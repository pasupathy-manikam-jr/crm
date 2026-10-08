<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Deal;
use App\Models\Product;
use App\Models\Quote;
use App\Models\Stage;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class QuotesTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    private User $outsider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-08 10:00'));
        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $this->outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function input(array $overrides = []): array
    {
        return [
            'owner_id' => $this->rep->id,
            'items' => [
                ['description' => 'GPS tracker', 'quantity' => '3', 'unit_price' => '450.00', 'discount_percent' => '10', 'tax_rate' => '8'],
                ['description' => 'Installation', 'quantity' => '1', 'unit_price' => '199.99', 'discount_percent' => '0', 'tax_rate' => '0'],
            ],
            ...$overrides,
        ];
    }

    public function test_a_quote_is_numbered_and_its_totals_computed_from_the_lines()
    {
        $this->actingAs($this->rep)->post(route('quotes.store'), $this->input())->assertSessionHasNoErrors();

        $quote = Quote::with('items')->firstOrFail();
        // Lines: 3 × 450 = 1350 − 10% = 1215 (+8% tax 97.20); 199.99, no tax.
        $this->assertSame('Q-2026-0001', $quote->number);
        $this->assertSame(['1549.99', '135.00', '97.20', '1512.19'], [$quote->subtotal, $quote->discount_total, $quote->tax_total, $quote->total]);
        $this->assertSame(['1215.00', '199.99'], $quote->items->pluck('line_total')->all());

        $this->actingAs($this->rep)->post(route('quotes.store'), $this->input());
        $this->assertSame('Q-2026-0002', Quote::latest('id')->value('number'));
    }

    public function test_editing_replaces_the_lines_and_recomputes()
    {
        $this->actingAs($this->rep)->post(route('quotes.store'), $this->input());
        $quote = Quote::firstOrFail();

        $this->actingAs($this->rep)->put(route('quotes.update', $quote), $this->input([
            'items' => [['description' => 'Support plan', 'quantity' => '2', 'unit_price' => '1000', 'tax_rate' => '6']],
        ]))->assertRedirect(route('quotes.show', $quote));

        $quote->refresh();
        $this->assertSame(1, $quote->items()->count());
        $this->assertSame('2120.00', $quote->total);
    }

    public function test_a_quote_needs_lines_with_a_description_and_positive_quantity()
    {
        $this->actingAs($this->rep)->post(route('quotes.store'), $this->input(['items' => []]))
            ->assertSessionHasErrors(['items' => 'Add at least one line.']);

        $this->actingAs($this->rep)->post(route('quotes.store'), $this->input(['items' => [['description' => '', 'quantity' => '0', 'unit_price' => '5']]]))
            ->assertSessionHasErrors(['items.0.description' => 'Describe this line.', 'items.0.quantity' => 'Quantity must be more than 0.']);
    }

    public function test_quotes_follow_visibility_and_only_link_visible_records()
    {
        $hidden = Account::factory()->for($this->outsider, 'owner')->create();
        $this->actingAs($this->rep)->post(route('quotes.store'), $this->input(['account_id' => $hidden->id]))
            ->assertSessionHasErrors(['account_id' => 'Choose one of your accounts.']);

        $theirs = Quote::factory()->for($this->outsider, 'owner')->create();
        $this->actingAs($this->rep)->get(route('quotes.show', $theirs))->assertNotFound();
    }

    public function test_starting_from_a_deal_prefills_its_account_and_contact()
    {
        $account = Account::factory()->for($this->rep, 'owner')->create();
        $deal = Deal::factory()->for($this->rep, 'owner')->for($account)->create(['stage_id' => Stage::factory()]);

        $this->actingAs($this->rep)->get(route('quotes.create', ['deal' => $deal->id]))->assertInertia(fn (Assert $page) => $page
            ->component('quotes/form')->where('prefill.deal_id', $deal->id)->where('prefill.account_id', $account->id));
    }

    public function test_status_changes_and_only_catalog_managers_edit_products()
    {
        $quote = Quote::factory()->for($this->rep, 'owner')->create();
        $this->actingAs($this->rep)->patch(route('quotes.status', $quote), ['status' => 'accepted']);
        $this->assertSame('accepted', $quote->fresh()->status->value);

        $this->actingAs($this->rep)->get(route('products.index'))->assertForbidden();
        $this->actingAs($this->userWithRole(UserRole::SalesManager))
            ->post(route('products.store'), ['name' => 'Tracker', 'unit_price' => '450', 'tax_rate' => '8'])
            ->assertSessionHasNoErrors();
        $this->assertTrue(Product::firstWhere('name', 'Tracker')->active);
    }
}
