<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Attachment;
use App\Models\Note;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class RecordTabsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $manager;

    private User $rep;

    private User $outsider;

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $team = Team::factory()->create();
        $this->manager = $this->userWithRole(UserRole::SalesManager, $team);
        $this->rep = $this->userWithRole(UserRole::SalesRep, $team);
        $this->outsider = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $this->account = Account::factory()->for($this->rep, 'owner')->create(['name' => 'Teraju']);
    }

    private function note(User $author): Note
    {
        return Note::factory()->for($author, 'author')->create(['notable_type' => 'account', 'notable_id' => $this->account->id]);
    }

    public function test_a_note_is_added_to_a_visible_record_and_shown_on_its_page()
    {
        $this->actingAs($this->rep)
            ->post(route('notes.store'), ['notable_type' => 'account', 'notable_id' => $this->account->id, 'body' => 'Budget approved.'])
            ->assertSessionHasNoErrors();

        $this->actingAs($this->rep)->get(route('accounts.show', $this->account))->assertInertia(fn (Assert $page) => $page
            ->has('notes', 1)->where('notes.0.body', 'Budget approved.')->where('notes.0.author.name', $this->rep->name));
    }

    public function test_notes_cannot_be_added_to_or_deleted_from_records_out_of_view()
    {
        $this->actingAs($this->outsider)
            ->post(route('notes.store'), ['notable_type' => 'account', 'notable_id' => $this->account->id, 'body' => 'x'])
            ->assertSessionHasErrors(['notable_id' => 'Choose a record you can see.']);

        $note = $this->note($this->rep);
        $this->actingAs($this->outsider)->delete(route('notes.destroy', $note))->assertNotFound();
        $this->assertModelExists($note);
    }

    public function test_only_the_author_or_an_admin_deletes_a_note()
    {
        $note = $this->note($this->rep);

        $this->actingAs($this->manager)->delete(route('notes.destroy', $note))->assertForbidden();
        $this->actingAs($this->userWithRole(UserRole::Admin))->delete(route('notes.destroy', $note))->assertRedirect();
        $this->assertModelMissing($note);
    }

    public function test_files_upload_privately_download_only_for_people_who_see_the_record()
    {
        $this->actingAs($this->rep)
            ->post(route('attachments.store'), [
                'attachable_type' => 'account',
                'attachable_id' => $this->account->id,
                'file' => UploadedFile::fake()->create('quote.pdf', 120, 'application/pdf'),
            ])
            ->assertSessionHasNoErrors();

        $file = Attachment::firstOrFail();
        $this->assertSame('quote.pdf', $file->name);
        Storage::disk('local')->assertExists($file->path);

        $this->actingAs($this->manager)->get(route('attachments.show', $file))->assertOk()->assertDownload('quote.pdf');
        $this->actingAs($this->outsider)->get(route('attachments.show', $file))->assertNotFound();

        $this->actingAs($this->rep)->delete(route('attachments.destroy', $file));
        Storage::disk('local')->assertMissing($file->path);
    }

    public function test_executables_and_oversized_files_are_refused()
    {
        $base = ['attachable_type' => 'account', 'attachable_id' => $this->account->id];

        $this->actingAs($this->rep)->post(route('attachments.store'), [...$base, 'file' => UploadedFile::fake()->create('setup.exe', 10)])
            ->assertSessionHasErrors('file');
        $this->actingAs($this->rep)->post(route('attachments.store'), [...$base, 'file' => UploadedFile::fake()->create('big.pdf', 11 * 1024, 'application/pdf')])
            ->assertSessionHasErrors('file');
        $this->assertSame(0, Attachment::count());
    }

    public function test_history_records_who_changed_what_with_names_for_linked_records()
    {
        $this->actingAs($this->manager)->put(route('accounts.update', $this->account), [
            'name' => 'Teraju Logistics',
            'owner_id' => $this->manager->id,
        ])->assertSessionHasNoErrors();

        $this->actingAs($this->manager)->get(route('accounts.show', $this->account))->assertInertia(fn (Assert $page) => $page
            ->where('history.0.event', 'updated')
            ->where('history.0.user', $this->manager->name)
            ->where('history.0.changes', fn ($changes) => collect($changes)->contains(fn ($c) => $c['field'] === 'Name' && $c['from'] === 'Teraju' && $c['to'] === 'Teraju Logistics')
                && collect($changes)->contains(fn ($c) => $c['field'] === 'Owner' && $c['from'] === $this->rep->name && $c['to'] === $this->manager->name))
            ->where('history.1.event', 'created'));
    }
}
