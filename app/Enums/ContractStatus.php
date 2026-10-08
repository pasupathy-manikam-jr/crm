<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum ContractStatus: string
{
    use HasOptions;

    case Draft = 'draft';
    case Active = 'active';
    /** Set by contracts:remind once an active contract's end date has passed. */
    case Expired = 'expired';
    case Cancelled = 'cancelled';
    /** A renewal deal was opened from it (see ContractController::renew). */
    case Renewed = 'renewed';

    public function label(): string
    {
        return __(ucfirst($this->value));
    }
}
