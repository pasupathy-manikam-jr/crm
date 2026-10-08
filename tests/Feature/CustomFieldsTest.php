<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\FieldDefinition;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class CustomFieldsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $admin;

    private User $rep;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = $this->userWithRole(UserRole::Admin);
        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
    }

    private function field(array $attributes): FieldDefinition
    {
        return FieldDefinition::create(['entity' => 'account', 'required' => false, 'active' => true, 'position' => 1, ...$attributes]);
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function sorted(array $values): array
    {
        ksort($values);

        return $values;
    }

    public function test_admins_add_fields_with_a_generated_key_and_others_cannot()
    {
        $this->actingAs($this->admin)->post(route('fields.store'), [
            'entity' => 'account', 'label' => 'Fleet size', 'type' => 'number',
        ])->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('fields.store'), [
            'entity' => 'account', 'label' => 'Fleet size', 'type' => 'text',
        ]);

        $this->assertSame(['fleet_size', 'fleet_size_2'], FieldDefinition::orderBy('id')->pluck('key')->all());
        $this->actingAs($this->rep)->post(route('fields.store'), ['entity' => 'account', 'label' => 'X', 'type' => 'text'])->assertForbidden();
    }

    public function test_dropdowns_need_choices_and_the_type_cannot_change_later()
    {
        $this->actingAs($this->admin)->post(route('fields.store'), ['entity' => 'lead', 'label' => 'Region', 'type' => 'select', 'options' => ''])
            ->assertSessionHasErrors(['options' => 'List at least one choice, one per line.']);

        $field = $this->field(['key' => 'region', 'label' => 'Region', 'type' => 'select', 'options' => ['North']]);
        $this->actingAs($this->admin)->put(route('fields.update', $field), ['label' => 'Region', 'type' => 'text', 'options' => "North\nSouth"])
            ->assertSessionHasErrors('type');
    }

    public function test_values_are_validated_stored_typed_and_kept_when_a_field_is_deactivated()
    {
        $fleet = $this->field(['key' => 'fleet_size', 'label' => 'Fleet size', 'type' => 'number', 'required' => true]);
        $this->field(['key' => 'tier', 'label' => 'Tier', 'type' => 'select', 'options' => ['Gold', 'Silver']]);
        $this->field(['key' => 'vip', 'label' => 'VIP', 'type' => 'checkbox']);
        $base = ['name' => 'Teraju', 'owner_id' => $this->rep->id];

        $this->actingAs($this->rep)->post(route('accounts.store'), [...$base, 'custom_fields' => ['fleet_size' => 'many', 'tier' => 'Bronze']])
            ->assertSessionHasErrors(['custom_fields.fleet_size' => 'The Fleet size field must be a number.', 'custom_fields.tier']);

        $this->actingAs($this->rep)->post(route('accounts.store'), [...$base, 'custom_fields' => ['fleet_size' => '42', 'tier' => 'Gold', 'vip' => '1']])
            ->assertSessionHasNoErrors();
        $account = Account::firstOrFail();
        $this->assertSame(['fleet_size' => 42, 'tier' => 'Gold', 'vip' => true], $this->sorted($account->custom_fields));

        $fleet->update(['active' => false]);
        $this->actingAs($this->rep)->put(route('accounts.update', $account), [...$base, 'custom_fields' => ['tier' => 'Silver']]);
        $this->assertSame(['fleet_size' => 42, 'tier' => 'Silver', 'vip' => true], $this->sorted($account->fresh()->custom_fields));

        $this->actingAs($this->rep)->get(route('accounts.show', $account))->assertInertia(fn (Assert $page) => $page
            ->where('history.0.changes.0', ['field' => 'Tier', 'from' => 'Gold', 'to' => 'Silver']));
    }

    public function test_csv_export_and_import_include_custom_fields()
    {
        $this->field(['key' => 'vip', 'label' => 'VIP', 'type' => 'checkbox']);

        $this->actingAs($this->rep)->post(route('csv.import', 'accounts'), [
            'file' => UploadedFile::fake()->createWithContent('a.csv', "Name,VIP\nTeraju,Yes\n"),
            'map' => ['name' => 0, 'custom:vip' => 1],
        ])->assertSessionHasNoErrors();
        $this->assertTrue(Account::firstOrFail()->custom_fields['vip']);

        $csv = $this->actingAs($this->rep)->get(route('csv.export', 'accounts'))->streamedContent();
        $this->assertStringContainsString(',VIP,Owner', $csv);
        $this->assertStringContainsString(',Yes,', $csv);
    }

    public function test_deleting_a_field_removes_it_and_its_values_but_only_admins_may()
    {
        $vip = $this->field(['key' => 'vip', 'label' => 'VIP', 'type' => 'checkbox']);
        $this->field(['key' => 'tier', 'label' => 'Tier', 'type' => 'text']);
        $account = Account::factory()->for($this->rep, 'owner')->create(['custom_fields' => ['vip' => '1', 'tier' => 'Gold']]);

        $this->actingAs($this->rep)->delete(route('fields.destroy', $vip))->assertForbidden();
        $this->actingAs($this->admin)->delete(route('fields.destroy', $vip))->assertRedirect();

        $this->assertModelMissing($vip);
        $this->assertSame(['tier' => 'Gold'], $account->fresh()->custom_fields);
    }

    public function test_lists_filter_by_dropdown_and_yes_no_fields_and_sort_numbers_numerically()
    {
        $this->field(['key' => 'tier', 'label' => 'Tier', 'type' => 'select', 'options' => ['Gold', 'Silver']]);
        $this->field(['key' => 'vip', 'label' => 'VIP', 'type' => 'checkbox']);
        $this->field(['key' => 'fleet', 'label' => 'Fleet size', 'type' => 'number']);
        $make = fn (string $name, array $values) => Account::factory()->for($this->rep, 'owner')->create(['name' => $name, 'custom_fields' => $values]);
        $make('Nine', ['tier' => 'Gold', 'vip' => true, 'fleet' => 9]);
        $make('Ten', ['tier' => 'Silver', 'vip' => false, 'fleet' => 10]);
        $make('Eighty', ['tier' => 'Gold', 'vip' => false, 'fleet' => 80]);

        $names = fn (array $query) => collect($this->actingAs($this->rep)->get(route('accounts.index', $query))
            ->assertOk()->inertiaProps('accounts.data'))->pluck('name')->all();

        $this->assertSame(['Eighty', 'Nine'], $names(['cf_tier' => 'Gold', 'sort' => 'name']));
        $this->assertSame(['Nine'], $names(['cf_tier' => 'Gold', 'cf_vip' => '1']));
        $this->assertSame(['Nine', 'Ten', 'Eighty'], $names(['sort' => 'custom:fleet']));
        $this->assertSame(['Eighty', 'Ten', 'Nine'], $names(['sort' => 'custom:fleet', 'direction' => 'desc']));
        // Unknown custom keys fall back to the default sort instead of reaching SQL.
        $this->assertCount(3, $names(['sort' => 'custom:nope', 'cf_nope' => 'x']));
    }
}
