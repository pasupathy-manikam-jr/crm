<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Mail\RecordEmail;
use App\Models\Contact;
use App\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class RecordEmailTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    public function test_sending_mails_from_the_users_name_and_logs_a_done_email_activity()
    {
        Mail::fake();
        $rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $contact = Contact::factory()->for($rep, 'owner')->create(['email' => 'aina@teraju.example']);

        $this->actingAs($rep)->post(route('emails.store'), [
            'regarding_type' => 'contact', 'regarding_id' => $contact->id,
            'to' => 'aina@teraju.example', 'cc' => 'ops@teraju.example', 'subject' => 'Your quotation', 'body' => 'Hi Aina, attached as discussed.',
        ])->assertSessionHasNoErrors();

        Mail::assertSent(RecordEmail::class, fn (RecordEmail $m) => $m->hasTo('aina@teraju.example') && $m->hasCc('ops@teraju.example')
            && $m->hasReplyTo($rep->email) && $m->subjectLine === 'Your quotation');

        $activity = $contact->activities()->firstOrFail();
        $this->assertSame(['email', 'Your quotation'], [$activity->type->value, $activity->subject]);
        $this->assertNotNull($activity->done_at);
        $this->assertStringContainsString('Hi Aina', (string) $activity->notes);
    }

    public function test_it_validates_and_only_emails_from_visible_records()
    {
        Mail::fake();
        $rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $hidden = Contact::factory()->for($this->userWithRole(UserRole::SalesRep, Team::factory()->create()), 'owner')->create();

        $this->actingAs($rep)->post(route('emails.store'), ['regarding_type' => 'contact', 'regarding_id' => $hidden->id, 'to' => 'bad', 'subject' => '', 'body' => ''])
            ->assertSessionHasErrors(['regarding_id', 'to' => 'The recipient field must be a valid email address.', 'subject', 'body' => 'The message field is required.']);
        Mail::assertNothingSent();
    }
}
