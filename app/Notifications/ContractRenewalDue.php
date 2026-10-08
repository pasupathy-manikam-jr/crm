<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a contract's owner it ends soon and is due for renewal.
 */
class ContractRenewalDue extends Notification
{
    use Queueable;

    public function __construct(public Contract $contract) {}

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
            ->subject(__('Renewal due: :name', ['name' => $this->contract->name]))
            ->line(__(':name with :account ends on :date.', [
                'name' => $this->contract->name,
                'account' => $this->contract->account?->name,
                'date' => $this->contract->end_date->translatedFormat('j M Y'),
            ]))
            ->line(__('Renew it into a new deal from the contract page, or update its status.'))
            ->action(__('Open the contract'), route('contracts.show', $this->contract));
    }
}
