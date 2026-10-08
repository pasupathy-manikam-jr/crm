<?php

namespace App\Http\Controllers;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\Note;
use App\Models\WebForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

/**
 * Public endpoint the website's form posts to. No login and no CSRF token (it lives on
 * another site); protected by the secret token, a honeypot field and rate limiting.
 */
class WebFormSubmissionController extends Controller
{
    public function __invoke(Request $request, string $token): RedirectResponse|JsonResponse|View
    {
        $form = WebForm::where('token', $token)->where('active', true)->firstOrFail();

        // Bots fill every field; people never see this one.
        if ($request->filled('website_url')) {
            return $this->done($request, $form);
        }

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($data, $form): void {
            $lead = Lead::create([
                ...array_diff_key($data, ['message' => true]),
                'source' => LeadSource::Website,
                'status' => LeadStatus::New,
                'owner_id' => $form->owner_id,
            ]);

            if (! empty($data['message'])) {
                Note::create(['notable_type' => 'lead', 'notable_id' => $lead->id, 'body' => "Message from “{$form->name}”:\n\n{$data['message']}"]);
            }

            $form->increment('submissions');
        });

        return $this->done($request, $form);
    }

    private function done(Request $request, WebForm $form): RedirectResponse|JsonResponse|View
    {
        if ($request->expectsJson()) {
            return response()->json(['ok' => true]);
        }

        return $form->redirect_url ? redirect()->away($form->redirect_url) : view('web-form-thanks');
    }
}
