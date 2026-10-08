<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ListsRecords;
use App\Models\User;
use App\Models\WebForm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin screen for website lead forms (admins and sales managers).
 */
class WebFormController extends Controller
{
    use ListsRecords;

    public function index(Request $request): Response
    {
        return Inertia::render('web-forms/index', [
            'forms' => WebForm::with('owner:id,name')->orderBy('name')->get()
                ->map(fn (WebForm $f) => [...$f->toArray(), 'submit_url' => route('web-forms.submit', $f->token)]),
            'owners' => User::orderBy('name')->get(['id', 'name'])->map(fn (User $u) => ['value' => (string) $u->id, 'label' => $u->name]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $form = WebForm::create($this->validated($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name created. Copy its embed code onto your website.', ['name' => $form->name])]);

        return back();
    }

    public function update(Request $request, WebForm $webForm): RedirectResponse
    {
        $webForm->update($this->validated($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $webForm->name])]);

        return back();
    }

    public function destroy(WebForm $webForm): RedirectResponse
    {
        $webForm->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted. Its embed code no longer works.', ['name' => $webForm->name])]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $request->merge(['active' => $request->input('active', 'active') === 'active']);

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'owner_id' => ['required', 'integer', Rule::exists(User::class, 'id')],
            'redirect_url' => ['nullable', 'url:http,https', 'max:255'],
            'active' => ['boolean'],
        ], [], ['owner_id' => __('lead owner'), 'redirect_url' => __('thank-you page')]);
    }
}
