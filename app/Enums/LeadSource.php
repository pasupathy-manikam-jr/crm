<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum LeadSource: string
{
    use HasOptions;

    case Website = 'website';
    case Referral = 'referral';
    case Email = 'email';
    case Phone = 'phone';
    case Event = 'event';
    case Other = 'other';

    public function label(): string
    {
        return __(ucfirst($this->value));
    }
}
