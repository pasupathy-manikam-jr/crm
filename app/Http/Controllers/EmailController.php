<?php

namespace App\Http\Controllers;

use App\Enums\ActivityType;
use App\Http\Requests\Crm\SendEmailRequest;
use App\Mail\RecordEmail;
use App\Models\Activity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Throwable;

/**
 * Send an email from a record and log it on the record as a done "Email" activity.
 */
class EmailController extends Controller
{
    public function store(SendEmailRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            Mail::to($validated['to'])
                ->cc(array_filter([$validated['cc'] ?? null]))
                ->send(new RecordEmail($validated['subject'], $validated['body'], $request->user()));
        } catch (Throwable $e) {
            Log::error('Record email failed', ['exception' => $e]);

            return back()->withErrors(['to' => __('The email couldn’t be sent. Check the mail settings, then try again.')]);
        }

        Activity::create([
            'type' => ActivityType::Email,
            'subject' => $validated['subject'],
            'notes' => "To: {$validated['to']}".($validated['cc'] ?? null ? "\nCc: {$validated['cc']}" : '')."\n\n{$validated['body']}",
            'regarding_type' => $validated['regarding_type'],
            'regarding_id' => $validated['regarding_id'],
            'owner_id' => $request->user()->id,
            // Shown as when it was sent.
            'due_at' => now(),
        ])->forceFill(['done_at' => now()])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Email sent to :to.', ['to' => $validated['to']])]);

        return back();
    }
}
