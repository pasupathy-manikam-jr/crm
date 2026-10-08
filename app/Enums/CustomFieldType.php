<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

enum CustomFieldType: string
{
    use HasOptions;

    case Text = 'text';
    case Textarea = 'textarea';
    case Number = 'number';
    case Date = 'date';
    case Checkbox = 'checkbox';
    case Select = 'select';

    public function label(): string
    {
        return match ($this) {
            self::Text => __('Text'),
            self::Textarea => __('Long text'),
            self::Number => __('Number'),
            self::Date => __('Date'),
            self::Checkbox => __('Yes / no'),
            self::Select => __('Dropdown'),
        };
    }
}
