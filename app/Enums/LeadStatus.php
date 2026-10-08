<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum LeadStatus: string
{
    use HasOptions;

    case New = 'new';
    case Contacted = 'contacted';
    case Qualified = 'qualified';
    case Lost = 'lost';
    /** Set by conversion only: the lead became an account, contact and maybe a deal. */
    case Converted = 'converted';

    public function label(): string
    {
        return __(ucfirst($this->value));
    }
}
