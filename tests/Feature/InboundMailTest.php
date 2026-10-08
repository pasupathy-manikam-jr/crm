<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\InboundEmail;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\Note;
use App\Models\Product;
use App\Models\Quote;
use App\Models\SupportCase;
use App\Models\Team;
use App\Models\User;
use App\Support\Mail\ImapInbox;
use App\Support\Mail\IncomingMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class InboundMailTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    private Contact $contact;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-10-08 10:00'));
        Storage::fake('local');
        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $account = Account::factory()->for($this->rep, 'owner')->create();
        $this->contact = Contact::factory()->for($this->rep, 'owner')->for($account)->create(['email' => 'aina@acme.test']);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function mailbox(array $attributes = []): Mailbox
    {
        return Mailbox::create([
            'name' => 'Support', 'host' => 'imap.test', 'username' => 'support@us.test', 'password' => 'secret',
            'owner_id' => $this->userWithRole(UserRole::SalesManager)->id, 'active' => true, ...$attributes,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function message(int $uid, array $overrides = []): IncomingMessage
    {
        return new IncomingMessage(...[
            'uid' => $uid,
            'messageId' => "m{$uid}@acme.test",
            'inReplyTo' => null,
            'references' => null,
            'fromEmail' => 'aina@acme.test',
            'fromName' => 'Aina',
            'subject' => 'Tracker offline',
            'body' => 'Unit 14 stopped reporting.',
            'receivedAt' => now(),
            ...$overrides,
        ]);
    }

    /**
     * @param  list<IncomingMessage>  ...$batches  What each successive sync reads.
     */
    private function inbox(array ...$batches): void
    {
        $this->mock(ImapInbox::class, fn (MockInterface $mock) => $mock->shouldReceive('fetch')->andReturn(...$batches));
    }

    public function test_an_email_opens_a_case_and_replies_join_it_once()
    {
        $mailbox = $this->mailbox(['create_cases' => true]);
        $first = $this->message(5, ['attachments' => [['name' => 'photo.jpg', 'mime' => 'image/jpeg', 'content' => 'jpeg-bytes']]]);
        $reply = $this->message(6, ['messageId' => 'm6@acme.test', 'inReplyTo' => 'm5@acme.test', 'subject' => 'Re: Tracker offline', 'body' => 'Still down.']);
        $this->inbox([$first], [$first, $reply]);

        $this->artisan('mail:sync')->assertSuccessful();
        $case = SupportCase::sole();
        $this->assertSame([$this->contact->id, $this->contact->account_id, $this->rep->id], [$case->contact_id, $case->account_id, $case->owner_id]);
        $this->assertSame('photo.jpg', $case->attachments()->sole()->name);
        $case->update(['status' => 'resolved']);

        // Second run: the first message again (already imported) plus the reply.
        $this->artisan('mail:sync');
        $this->assertSame(1, SupportCase::count());
        $this->assertSame(2, InboundEmail::count());
        $this->assertStringContainsString('Still down.', Note::sole()->body);
        $this->assertSame('open', $case->fresh()?->status->value);
        $this->assertSame(2, Activity::where('regarding_id', $case->id)->count());
        $this->assertSame(6, $mailbox->fresh()?->last_uid);
    }

    public function test_a_case_number_in_the_subject_threads_and_blocked_domains_are_ignored()
    {
        $this->mailbox(['create_cases' => true, 'blocked_domains' => "spam.test\n"]);
        $case = SupportCase::factory()->for($this->rep, 'owner')->create();
        $this->inbox([
            $this->message(1, ['subject' => "Re: [{$case->number}] update"]),
            $this->message(2, ['fromEmail' => 'x@spam.test']),
            $this->message(3, ['fromEmail' => 'new@other.test']),
        ]);

        $this->artisan('mail:sync');

        $this->assertSame(2, SupportCase::count());
        $this->assertSame(1, Note::where('notable_id', $case->id)->count());
        $this->assertSame(['matched', 'ignored', 'unmatched'], InboundEmail::orderBy('id')->pluck('status')->all());
    }

    public function test_a_quote_request_becomes_a_draft_quote_with_unmatched_items_flagged()
    {
        config(['services.anthropic.key' => 'test-key', 'services.anthropic.input_cost_per_mtok' => 3, 'services.anthropic.output_cost_per_mtok' => 15]);
        $tracker = Product::factory()->create(['sku' => 'GPS-1', 'unit_price' => '450.00', 'tax_rate' => '8']);
        Http::fake(['api.anthropic.com/*' => Http::response([
            'content' => [['type' => 'tool_use', 'name' => 'record_quote_request', 'input' => [
                'is_quote_request' => true, 'confidence' => 0.92, 'requested_date' => '2026-11-01',
                'items' => [
                    ['product_sku' => 'GPS-1', 'description' => 'GPS trackers', 'quantity' => 10],
                    ['product_sku' => null, 'description' => 'Custom bracket', 'quantity' => 10],
                ],
            ]]],
            'usage' => ['input_tokens' => 1000, 'output_tokens' => 200],
        ])]);
        $this->mailbox(['draft_quotes' => true]);
        $this->inbox([$this->message(1, ['subject' => 'Price for 10 trackers?'])]);

        $this->artisan('mail:sync');

        $email = InboundEmail::sole();
        $quote = Quote::with('items')->sole();
        $this->assertSame(['drafted', $quote->id, '0.006000'], [$email->ai_status, $email->quote_id, $email->ai_cost]);
        $this->assertSame(['draft', $this->contact->id, $this->rep->id], [$quote->status->value, $quote->contact_id, $quote->owner_id]);
        $this->assertSame([$tracker->id, null], $quote->items->pluck('product_id')->all());
        $this->assertSame(['450.00', '0.00'], $quote->items->pluck('unit_price')->all());
        $this->assertStringContainsString('Not matched to a product (priced at 0): 10 × Custom bracket', (string) $quote->notes);
        $this->assertStringContainsString('Requested date: 2026-11-01', (string) $quote->notes);
        // Logged on the contact's timeline too (no case mailbox).
        $this->assertSame(1, Activity::where('regarding_type', 'contact')->where('regarding_id', $this->contact->id)->count());
        Http::assertSent(fn (HttpRequest $r) => $r->hasHeader('x-api-key', 'test-key') && $r['tool_choice']['name'] === 'record_quote_request');
    }

    public function test_extraction_is_skipped_without_a_key_and_low_confidence_drafts_nothing()
    {
        $this->mailbox(['draft_quotes' => true]);
        $this->inbox([$this->message(1)], [$this->message(2)]);

        config(['services.anthropic.key' => null]);
        $this->artisan('mail:sync');
        $this->assertSame('skipped', InboundEmail::sole()->ai_status);

        config(['services.anthropic.key' => 'k']);
        Http::fake(['api.anthropic.com/*' => Http::response([
            'content' => [['type' => 'tool_use', 'input' => ['is_quote_request' => true, 'confidence' => 0.3, 'items' => []]]],
            'usage' => ['input_tokens' => 10, 'output_tokens' => 5],
        ])]);
        $this->artisan('mail:sync');
        $this->assertSame('not_quote', InboundEmail::latest('id')->first()?->ai_status);
        $this->assertSame(0, Quote::count());
    }

    public function test_a_connection_failure_is_kept_on_the_mailbox()
    {
        $mailbox = $this->mailbox();
        $this->mock(ImapInbox::class, fn (MockInterface $mock) => $mock->shouldReceive('fetch')->andThrow(new \RuntimeException('AUTHENTICATIONFAILED')));

        $this->artisan('mail:sync')->assertSuccessful();

        $this->assertSame('AUTHENTICATIONFAILED', $mailbox->fresh()?->last_error);
    }

    public function test_domain_lists()
    {
        $mailbox = new Mailbox(['allowed_domains' => 'acme.test, @Partner.test', 'blocked_domains' => 'bad.acme.test']);

        $this->assertTrue($mailbox->accepts('a@acme.test'));
        $this->assertTrue($mailbox->accepts('b@partner.test'));
        $this->assertFalse($mailbox->accepts('c@other.test'));
    }

    public function test_admins_manage_mailboxes_and_a_blank_password_keeps_the_saved_one()
    {
        $admin = $this->userWithRole(UserRole::Admin);
        $input = ['name' => 'Sales', 'host' => 'imap.gmail.com', 'port' => '993', 'encryption' => 'ssl', 'username' => 'sales@us.test', 'password' => 'app-pass', 'folder' => 'INBOX', 'owner_id' => $this->rep->id, 'draft_quotes' => '1', 'active' => '0'];

        $this->actingAs($this->rep)->post(route('mailboxes.store'), $input)->assertForbidden();
        $this->actingAs($admin)->post(route('mailboxes.store'), [...$input, 'host' => 'imap.test/../x'])->assertSessionHasErrors('host');
        $this->actingAs($admin)->post(route('mailboxes.store'), $input)->assertSessionHasNoErrors();

        $mailbox = Mailbox::sole();
        $this->assertSame(['app-pass', true, false], [$mailbox->password, $mailbox->draft_quotes, $mailbox->active]);
        $this->assertArrayNotHasKey('password', $mailbox->toArray());

        $this->actingAs($admin)->put(route('mailboxes.update', $mailbox), [...$input, 'password' => '', 'name' => 'Sales desk']);
        $this->assertSame(['Sales desk', 'app-pass'], [$mailbox->fresh()?->name, $mailbox->fresh()?->password]);
    }

    public function test_an_unknown_sender_becomes_a_lead_from_the_inbox()
    {
        $manager = $this->userWithRole(UserRole::SalesManager);
        $mailbox = $this->mailbox();
        $email = InboundEmail::create([
            'mailbox_id' => $mailbox->id, 'message_id' => 'x@new.test', 'from_email' => 'siti@new.test', 'from_name' => 'Siti Nur Aisyah',
            'subject' => 'Hello', 'body' => 'Interested in trackers', 'received_at' => now(), 'status' => 'unmatched',
        ]);

        $this->actingAs($this->rep)->get(route('inbox.index'))->assertForbidden();
        $this->actingAs($manager)->get(route('inbox.index'))->assertOk();
        $this->actingAs($manager)->post(route('inbox.lead', $email))->assertRedirect();

        $lead = Lead::withoutGlobalScopes()->sole();
        $this->assertSame(['Siti', 'Nur Aisyah', 'siti@new.test', 'email', $mailbox->owner_id], [$lead->first_name, $lead->last_name, $lead->email, $lead->source?->value, $lead->owner_id]);
        $this->assertSame([$lead->id, 'matched'], [$email->fresh()?->lead_id, $email->fresh()?->status]);
        $this->actingAs($manager)->post(route('inbox.lead', $email))->assertStatus(409);
    }
}
