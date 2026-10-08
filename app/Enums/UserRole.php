<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Role names, backed by spatie/laravel-permission roles of the same name.
 */
enum UserRole: string
{
    use HasOptions;

    case Admin = 'admin';
    case SalesManager = 'sales-manager';
    case SalesRep = 'sales-rep';

    public function label(): string
    {
        return match ($this) {
            self::Admin => __('Admin'),
            self::SalesManager => __('Sales manager'),
            self::SalesRep => __('Sales rep'),
        };
    }

    /**
     * Whose records this role can see: everyone's, its team's, or only its own.
     */
    public function visibility(): string
    {
        return match ($this) {
            self::Admin => 'all',
            self::SalesManager => 'team',
            self::SalesRep => 'own',
        };
    }
}
