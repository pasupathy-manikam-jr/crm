<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Lead;
use App\Models\User;
use App\Models\WebForm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

class WebFormsTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    private User $rep;

    private WebForm $form;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rep = $this->userWithRole(UserRole::SalesRep);
        $this->form = WebForm::create(['name' => 'Contact us', 'owner_id' => $this->rep->id]);
    }

    public function test_a_submission_without_login_or_csrf_creates_a_lead_owned_by_the_forms_owner()
    {
        $this->post(route('web-forms.submit', $this->form->token), [
            'first_name' => 'Aina', 'last_name' => 'Zakaria', 'email' => 'aina@teraju.example', 'company' => 'Teraju', 'message' => 'Need 40 trackers.',
        ])->assertOk()->assertSee('Thank you');

        $lead = Lead::firstOrFail();
        $this->assertSame([$this->rep->id, 'website', 'new'], [$lead->owner_id, $lead->source->value, $lead->status->value]);
        $this->assertStringContainsString('Need 40 trackers.', $lead->notes()->value('body'));
        $this->assertSame(1, $this->form->fresh()->submissions);
    }

    public function test_it_redirects_when_a_thank_you_page_is_set_and_validates_names()
    {
        $this->form->update(['redirect_url' => 'https://example.com/thanks']);

        $this->post(route('web-forms.submit', $this->form->token), ['first_name' => 'A', 'last_name' => 'B'])
            ->assertRedirect('https://example.com/thanks');
        $this->post(route('web-forms.submit', $this->form->token), ['first_name' => ''])
            ->assertSessionHasErrors(['first_name', 'last_name']);
    }

    public function test_bots_filling_the_honeypot_get_thanked_but_create_nothing()
    {
        $this->post(route('web-forms.submit', $this->form->token), ['first_name' => 'Spam', 'last_name' => 'Bot', 'website_url' => 'http://spam.example'])->assertOk();

        $this->assertSame(0, Lead::count());
    }

    public function test_unknown_or_inactive_forms_are_not_found_and_submissions_are_rate_limited()
    {
        $this->post('/f/not-a-real-token', ['first_name' => 'A', 'last_name' => 'B'])->assertNotFound();

        $this->form->update(['active' => false]);
        $this->post(route('web-forms.submit', $this->form->token), ['first_name' => 'A', 'last_name' => 'B'])->assertNotFound();

        $this->form->update(['active' => true]);
        for ($i = 0; $i < 10; $i++) {
            $this->post(route('web-forms.submit', $this->form->token), ['first_name' => "A{$i}", 'last_name' => 'B']);
        }
        $this->post(route('web-forms.submit', $this->form->token), ['first_name' => 'A', 'last_name' => 'B'])->assertTooManyRequests();
    }

    public function test_only_admins_and_managers_manage_forms()
    {
        $this->actingAs($this->rep)->get(route('web-forms.index'))->assertForbidden();
        $this->actingAs($this->userWithRole(UserRole::SalesManager))->get(route('web-forms.index'))->assertOk();
    }
}
