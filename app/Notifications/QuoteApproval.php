<?php

namespace App\Notifications;

use App\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Approval traffic on a quote: "needs approval" to approvers, the decision to the owner.
 */
class QuoteApproval extends Notification
{
    use Queueable;

    public function __construct(public Quote $quote, public string $subject, public string $line) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject)
            ->line($this->line)
            ->action(__('Open the quote'), route('quotes.show', $this->quote));
    }
}
