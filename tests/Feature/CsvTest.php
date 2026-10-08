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
use Illuminate\Http\UploadedFile;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class CsvTest extends TestCase
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

    private function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('import.csv', $content);
    }

    public function test_export_downloads_only_visible_records_with_the_list_filters()
    {
        Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Aina', 'last_name' => 'Zakaria', 'status' => LeadStatus::Qualified]);
        Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Ben', 'last_name' => 'Lim', 'status' => LeadStatus::New]);
        Lead::factory()->for($this->outsider, 'owner')->create(['first_name' => 'Hidden', 'status' => LeadStatus::Qualified]);

        $response = $this->actingAs($this->rep)->get(route('csv.export', ['type' => 'leads', 'status' => 'qualified']));
        $response->assertOk()->assertDownload('leads-'.now()->format('Y-m-d').'.csv');
        $lines = array_filter(explode("\n", $response->streamedContent()));

        $this->assertCount(2, $lines);
        $this->assertStringStartsWith('"First name","Last name"', $lines[0]);
        $this->assertStringContainsString('Aina,Zakaria', $lines[1]);
    }

    public function test_import_maps_columns_skips_bad_rows_and_owns_records()
    {
        $file = $this->csv("Organisation,Mail,Junk\nTeraju Logistics,ops@teraju.example,x\n,missing@name.example,y\nHyatt Group,not-an-email,z\n");

        $this->actingAs($this->rep)
            ->post(route('csv.import', 'accounts'), ['file' => $file, 'map' => ['name' => 0, 'email' => 1]])
            ->assertSessionHas('inertia.flash_data.importSkipped', fn (array $skipped) => count($skipped) === 2 && str_starts_with($skipped[0], 'Row 3:'))
            ->assertSessionHas('inertia.flash_data.toast.message', '1 imported, 2 skipped.');

        $this->assertDatabaseHas('accounts', ['name' => 'Teraju Logistics', 'email' => 'ops@teraju.example', 'owner_id' => $this->rep->id]);
        $this->assertSame(1, Account::count());
    }

    public function test_contacts_link_to_visible_accounts_by_name()
    {
        $mine = Account::factory()->for($this->rep, 'owner')->create(['name' => 'Teraju']);
        Account::factory()->for($this->outsider, 'owner')->create(['name' => 'Secret Co']);

        $this->actingAs($this->rep)->post(route('csv.import', 'contacts'), [
            'file' => $this->csv("first,last,company\nAina,Zakaria,teraju\nBen,Lim,Secret Co\n"),
            'map' => ['first_name' => 0, 'last_name' => 1, 'account' => 2],
        ]);

        $this->assertSame($mine->id, Contact::firstWhere('first_name', 'Aina')->account_id);
        $this->assertNull(Contact::firstWhere('first_name', 'Ben')->account_id);
    }

    public function test_import_requires_a_column_for_every_required_field_and_a_csv_file()
    {
        $this->actingAs($this->rep)
            ->post(route('csv.import', 'leads'), ['file' => $this->csv("a,b\n1,2\n"), 'map' => ['first_name' => 0]])
            ->assertSessionHasErrors(['map' => 'Choose a column for: Last name.']);

        $this->actingAs($this->rep)
            ->post(route('csv.import', 'leads'), ['file' => UploadedFile::fake()->create('x.exe', 1), 'map' => ['first_name' => 0, 'last_name' => 1]])
            ->assertSessionHasErrors(['file' => 'Choose a .csv file.']);

        $this->assertSame(0, Lead::count());
    }

    public function test_imported_leads_cannot_be_marked_converted()
    {
        $this->actingAs($this->rep)->post(route('csv.import', 'leads'), [
            'file' => $this->csv("f,l,s\nA,B,Converted\nC,D,Qualified\n"),
            'map' => ['first_name' => 0, 'last_name' => 1, 'status' => 2],
        ]);

        $this->assertSame(['qualified'], Lead::pluck('status')->map->value->all());
    }

    public function test_unknown_types_are_not_routed()
    {
        $this->actingAs($this->rep)->get('/export/users')->assertNotFound();
    }
}
