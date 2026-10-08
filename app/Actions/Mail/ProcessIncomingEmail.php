<?php

namespace App\Actions\Mail;

use App\Enums\ActivityType;
use App\Jobs\ExtractQuoteFromEmail;
use App\Models\Activity;
use App\Models\Attachment;
use App\Models\Contact;
use App\Models\InboundEmail;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\Note;
use App\Models\SupportCase;
use App\Support\Mail\IncomingMessage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * File one email read from a mailbox: skip it if already imported, apply the domain
 * filters, match the sender to a contact (else an open lead), then:
 *  - with "create cases": a reply (by In-Reply-To/References, or a C-YYYY-NNNN number in
 *    the subject) goes onto its case as a note, reopening it; anything else opens a case;
 *  - otherwise it's logged on the matched contact or lead's timeline;
 *  - with "draft quotes": matched emails are queued for Claude to read (ExtractQuoteFromEmail).
 */
final class ProcessIncomingEmail
{
    /** Attachments bigger than this are not saved. */
    private const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

    public function handle(Mailbox $mailbox, IncomingMessage $message): ?InboundEmail
    {
        if (InboundEmail::where('message_id', $message->messageId)->exists()) {
            return null;
        }

        $accepted = $message->fromEmail !== '' && $mailbox->accepts($message->fromEmail);
        $contact = $accepted ? Contact::withoutGlobalScope('visible')->where('email', $message->fromEmail)->first() : null;
        $lead = $accepted && $contact === null
            ? Lead::withoutGlobalScope('visible')->where('email', $message->fromEmail)->whereNull('converted_at')->first()
            : null;

        $email = InboundEmail::create([
            'mailbox_id' => $mailbox->id,
            'message_id' => $message->messageId,
            'in_reply_to' => $message->inReplyTo,
            'references' => $message->references,
            'from_email' => $message->fromEmail,
            'from_name' => $message->fromName,
            'subject' => $message->subject !== null ? Str::limit($message->subject, 250, '…') : null,
            'body' => Str::limit($message->body, 60000, '…'),
            'received_at' => $message->receivedAt,
            'status' => ! $accepted ? 'ignored' : ($contact || $lead ? 'matched' : 'unmatched'),
            'contact_id' => $contact?->id,
            'account_id' => $contact?->account_id,
            'lead_id' => $lead?->id,
        ]);

        if (! $accepted) {
            return $email;
        }

        if ($mailbox->create_cases) {
            $case = $this->fileOnCase($mailbox, $email, $contact);
            $this->saveAttachments($case, $message);
            $this->logActivity($email, $case);
        } elseif ($contact ?? $lead) {
            $this->logActivity($email, $contact ?? $lead);
        }

        if ($mailbox->draft_quotes && $email->status === 'matched') {
            $email->update(['ai_status' => 'pending']);
            ExtractQuoteFromEmail::dispatch($email)->afterCommit();
        }

        return $email;
    }

    private function fileOnCase(Mailbox $mailbox, InboundEmail $email, ?Contact $contact): SupportCase
    {
        $case = $this->threadCase($email);

        if ($case !== null) {
            Note::create([
                'notable_type' => $case->getMorphClass(),
                'notable_id' => $case->id,
                'body' => Str::limit("Email from {$email->from_email}: {$email->subject}\n\n{$email->body}", 20000, '…'),
            ]);

            if ($case->status->isDone()) {
                $case->update(['status' => 'open']);
            }
        } else {
            $case = SupportCase::create([
                'subject' => $email->subject ?: "Email from {$email->from_email}",
                'description' => Str::limit((string) $email->body, 10000, '…'),
                'account_id' => $contact?->account_id,
                'contact_id' => $contact?->id,
                'priority' => 'normal',
                'status' => 'open',
                'owner_id' => $contact->owner_id ?? $mailbox->owner_id,
            ]);
        }

        $email->update(['support_case_id' => $case->id]);

        return $case;
    }

    /**
     * The case an earlier email in this thread opened or joined, else one named by number
     * in the subject ("Re: [C-2026-0012] …").
     */
    private function threadCase(InboundEmail $email): ?SupportCase
    {
        $ids = collect(preg_split('/\s+/', "{$email->in_reply_to} {$email->references}") ?: [])
            ->map(fn (string $id): string => trim($id, '<> '))->filter()->unique()->values()->all();

        $caseId = $ids === [] ? null : InboundEmail::whereIn('message_id', $ids)->whereNotNull('support_case_id')->latest('id')->value('support_case_id');

        if ($caseId === null && preg_match('/\bC-\d{4}-\d{4,}\b/', (string) $email->subject, $m) === 1) {
            return SupportCase::withoutGlobalScope('visible')->where('number', $m[0])->first();
        }

        return $caseId === null ? null : SupportCase::withoutGlobalScope('visible')->find((int) $caseId);
    }

    private function saveAttachments(SupportCase $case, IncomingMessage $message): void
    {
        foreach ($message->attachments as $file) {
            if (strlen($file['content']) > self::MAX_ATTACHMENT_BYTES) {
                continue;
            }

            $name = Str::limit(basename($file['name']), 200, '');
            $path = 'attachments/case/'.Str::uuid().'-'.Str::slug(pathinfo($name, PATHINFO_FILENAME)).'.'.Str::lower(pathinfo($name, PATHINFO_EXTENSION) ?: 'bin');
            Storage::disk('local')->put($path, $file['content']);

            Attachment::create([
                'attachable_type' => $case->getMorphClass(),
                'attachable_id' => $case->id,
                'name' => $name,
                'path' => $path,
                'mime_type' => $file['mime'],
                'size' => strlen($file['content']),
            ]);
        }
    }

    /**
     * A done Email activity on the record's timeline, like emails sent from the CRM.
     */
    private function logActivity(InboundEmail $email, Model $record): void
    {
        Activity::create([
            'type' => ActivityType::Email,
            'subject' => Str::limit("Email from {$email->from_email}: {$email->subject}", 250, '…'),
            'notes' => Str::limit((string) $email->body, 2000, '…'),
            'due_at' => $email->received_at,
            'owner_id' => $record->getAttribute('owner_id'),
            'regarding_type' => $record->getMorphClass(),
            'regarding_id' => $record->getKey(),
        ])->forceFill(['done_at' => $email->received_at])->save();
    }
}
