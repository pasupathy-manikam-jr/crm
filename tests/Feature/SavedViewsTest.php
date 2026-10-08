<?php

namespace Tests\Feature;

use App\Models\SavedView;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SavedViewsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_view_saves_only_known_filters_and_is_shared_back_to_its_owner()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('saved-views.store'), [
            'list' => 'leads',
            'name' => 'Qualified',
            'query' => ['status' => 'qualified', 'sort' => 'company', 'page' => '3', 'evil' => 'x', 'search' => ''],
        ])->assertSessionHasNoErrors();

        $this->assertEquals(['status' => 'qualified', 'sort' => 'company'], SavedView::firstOrFail()->query);
        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('savedViews.0.name', 'Qualified'));
    }

    public function test_saving_the_same_name_replaces_and_unknown_lists_are_refused()
    {
        $user = User::factory()->create();

        foreach (['new', 'lost'] as $status) {
            $this->actingAs($user)->post(route('saved-views.store'), ['list' => 'leads', 'name' => 'Mine', 'query' => ['status' => $status]]);
        }
        $this->assertSame(['status' => 'lost'], SavedView::sole()->query);

        $this->actingAs($user)->post(route('saved-views.store'), ['list' => 'users', 'name' => 'x'])->assertSessionHasErrors('list');
    }

    public function test_users_cannot_see_or_delete_someone_elses_views()
    {
        $view = User::factory()->create()->savedViews()->create(['list' => 'deals', 'name' => 'Theirs', 'query' => []]);
        $other = User::factory()->create();

        $this->actingAs($other)->delete(route('saved-views.destroy', $view->id))->assertNotFound();
        $this->actingAs($other)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->has('savedViews', 0));
        $this->assertModelExists($view);
    }
}
