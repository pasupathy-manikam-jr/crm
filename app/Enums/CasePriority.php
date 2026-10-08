<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum CasePriority: string
{
    use HasOptions;

    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';

    public function label(): string
    {
        return __(ucfirst($this->value));
    }

    /**
     * How long from opening until the case must be resolved, in working time (see
     * App\Support\BusinessHours).
     *
     * @return array{0: int, 1: 'hours'|'days'}
     */
    public function slaTarget(): array
    {
        return match ($this) {
            self::Low => [5, 'days'],
            self::Normal => [3, 'days'],
            self::High => [1, 'days'],
            self::Urgent => [4, 'hours'],
        };
    }
}
