<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum ActivityType: string
{
    use HasOptions;

    case Call = 'call';
    case Meeting = 'meeting';
    case Task = 'task';
    /** Logged automatically when an email is sent from a record. */
    case Email = 'email';

    public function label(): string
    {
        return __(ucfirst($this->value));
    }
}
