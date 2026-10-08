<?php

namespace App\Enums\Concerns;

/**
 * For string-backed enums with a label(): the value/label pairs a select needs.
 */
trait HasOptions
{
    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $case) => ['value' => $case->value, 'label' => $case->label()], self::cases());
    }
}
