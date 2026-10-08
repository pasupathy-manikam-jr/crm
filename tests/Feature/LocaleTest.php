<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Contract;
use App\Models\Team;
use App\Models\User;
use App\Notifications\ContractRenewalDue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    public function test_a_user_switches_language_and_pages_use_it()
    {
        $user = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());

        $this->actingAs($user)->post(route('locale.update'), ['locale' => 'zh_CN'])->assertRedirect()->assertCookie('locale', 'zh_CN');
        $this->assertSame('zh_CN', $user->fresh()?->locale);

        $this->actingAs($user->fresh())->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'zh_CN')->has('locales', 3));

        $this->actingAs($user)->post(route('locale.update'), ['locale' => 'fr'])->assertSessionHasErrors('locale');
    }

    public function test_guests_get_the_cookie_or_their_browser_language()
    {
        $this->get(route('login'), ['Accept-Language' => 'ms-MY,ms;q=0.9,en;q=0.5'])
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'ms'));

        $this->get(route('login'), ['Accept-Language' => 'de-DE'])
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));

        $this->withCookie('locale', 'zh_CN')->get(route('login'), ['Accept-Language' => 'ms'])
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'zh_CN'));
    }

    public function test_validation_messages_follow_the_users_language()
    {
        $user = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $user->update(['locale' => 'ms']);

        $this->actingAs($user)->post(route('leads.store'), [])
            ->assertSessionHasErrors(['first_name' => trans('validation.required', ['attribute' => 'nama pertama'], 'ms')]);
    }

    public function test_emails_go_out_in_the_recipients_language()
    {
        Notification::fake();
        $owner = $this->userWithRole(UserRole::SalesRep, Team::factory()->create());
        $owner->update(['locale' => 'zh_CN']);
        Contract::factory()->for($owner, 'owner')->create(['end_date' => today()->addDays(10)]);

        $this->artisan('contracts:remind');

        Notification::assertSentTo($owner, ContractRenewalDue::class, fn ($n, array $channels, User $notifiable, string $locale) => $locale === 'zh_CN');
    }
}
