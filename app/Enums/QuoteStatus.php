<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum QuoteStatus: string
{
    use HasOptions;

    case Draft = 'draft';
    /** Set only by a workflow approval rule; locked until a manager decides. */
    case PendingApproval = 'pending_approval';
    case Sent = 'sent';
    case Accepted = 'accepted';
    case Declined = 'declined';

    public function label(): string
    {
        return __(ucfirst(str_replace('_', ' ', $this->value)));
    }
}
