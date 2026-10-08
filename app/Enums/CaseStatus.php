<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum CaseStatus: string
{
    use HasOptions;

    case Open = 'open';
    /** Waiting on the customer; the SLA clock still runs. */
    case Pending = 'pending';
    case Resolved = 'resolved';
    case Closed = 'closed';

    public function label(): string
    {
        return __(ucfirst($this->value));
    }

    /** Resolved or closed: the SLA no longer applies. */
    public function isDone(): bool
    {
        return $this === self::Resolved || $this === self::Closed;
    }
}
