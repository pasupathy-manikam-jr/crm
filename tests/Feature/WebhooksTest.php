<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Lead;
use App\Models\Team;
use App\Models\User;
use App\Models\Webhook;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class WebhooksTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rep = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        config(['app.webhooks_allow_private' => true]);
    }

    public function test_subscribed_events_are_posted_signed_and_others_are_not()
    {
        Http::fake(['hooks.test/*' => Http::response('ok')]);
        $webhook = Webhook::create(['url' => 'https://hooks.test/crm', 'events' => ['lead.created', 'lead.deleted']]);

        $lead = Lead::factory()->for($this->rep, 'owner')->create(['first_name' => 'Aina']);
        $lead->update(['first_name' => 'Aina R']);
        $lead->delete();

        Http::assertSentCount(2);
        Http::assertSent(function (HttpRequest $request) use ($webhook, $lead): bool {
            $signature = 'sha256='.hash_hmac('sha256', $request->body(), $webhook->secret);

            return $request['event'] === 'lead.created'
                && $request['data']['id'] === $lead->id
                && $request['data']['first_name'] === 'Aina'
                && $request->hasHeader('X-OricCRM-Signature', $signature);
        });
        $this->assertSame(200, $webhook->fresh()?->last_status);
    }

    public function test_a_failing_receiver_is_recorded()
    {
        Http::fake(['hooks.test/*' => Http::response('nope', 500)]);
        $webhook = Webhook::create(['url' => 'https://hooks.test/crm', 'events' => ['lead.created']]);

        try {
            Lead::factory()->for($this->rep, 'owner')->create();
        } catch (\RuntimeException) {
            // The sync queue rethrows; a real worker retries.
        }

        $this->assertSame([500, 'HTTP 500'], [$webhook->fresh()?->last_status, $webhook->fresh()?->last_error]);
    }

    public function test_private_and_local_addresses_are_refused()
    {
        config(['app.webhooks_allow_private' => false]);

        $this->assertFalse(Webhook::isAllowedUrl('http://127.0.0.1/hook'));
        $this->assertFalse(Webhook::isAllowedUrl('http://10.1.2.3/hook'));
        $this->assertFalse(Webhook::isAllowedUrl('http://169.254.169.254/latest'));
        $this->assertFalse(Webhook::isAllowedUrl('ftp://93.184.216.34/'));
        $this->assertTrue(Webhook::isAllowedUrl('https://93.184.216.34/hook'));

        $admin = $this->userWithRole(UserRole::Admin);
        $this->actingAs($admin)->post(route('webhooks.store'), ['url' => 'http://127.0.0.1:8000/x', 'events' => ['lead.created']])
            ->assertSessionHasErrors('url');
    }

    public function test_only_admins_manage_webhooks_and_the_test_button_pings()
    {
        Http::fake(['hooks.test/*' => Http::response('ok')]);
        $admin = $this->userWithRole(UserRole::Admin);

        $this->actingAs($this->rep)->get(route('webhooks.index'))->assertForbidden();
        $this->actingAs($admin)->post(route('webhooks.store'), ['url' => 'https://hooks.test/a', 'events' => ['deal.updated', 'nope.created']])
            ->assertSessionHasErrors('events.1');
        $this->actingAs($admin)->post(route('webhooks.store'), ['url' => 'https://hooks.test/a', 'events' => ['deal.updated']])
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('webhooks.test', Webhook::sole()))->assertRedirect();
        Http::assertSent(fn (HttpRequest $request) => $request['event'] === 'ping');
    }
}
