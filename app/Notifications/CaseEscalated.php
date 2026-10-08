<?php

namespace App\Notifications;

use App\Models\SupportCase;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a case's owner and their team's managers that it has missed its SLA.
 */
class CaseEscalated extends Notification
{
    use Queueable;

    public function __construct(public SupportCase $case) {}

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
            ->error()
            ->subject(__('SLA missed: :number :subject', ['number' => $this->case->number, 'subject' => $this->case->subject]))
            ->line(__('Case :number (:priority priority) was due to be resolved by :due and is still :status.', [
                'number' => $this->case->number,
                'priority' => $this->case->priority->label(),
                'due' => $this->case->sla_due_at->translatedFormat('j M Y, g:i a'),
                'status' => mb_strtolower($this->case->status->label()),
            ]))
            ->line(__('Owner: :name', ['name' => $this->case->owner?->name]))
            ->action(__('Open the case'), route('cases.show', $this->case));
    }
}
