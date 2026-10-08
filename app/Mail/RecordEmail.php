<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * A plain email a user writes from a CRM record. Sent from the app's address with the
 * user's name, so replies go straight to the user.
 */
class RecordEmail extends Mailable
{
    use Queueable;

    public function __construct(public string $subjectLine, public string $body, public User $sender) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address((string) config('mail.from.address'), $this->sender->name),
            replyTo: [new Address($this->sender->email, $this->sender->name)],
            subject: $this->subjectLine,
        );
    }

    public function content(): Content
    {
        return new Content(text: 'mail.record-email');
    }
}
