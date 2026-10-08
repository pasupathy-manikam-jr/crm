<?php

namespace App\Models;

use App\Enums\CustomFieldType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

/**
 * An admin-defined extra field on accounts, contacts, leads or deals. Values live in
 * the record's custom_fields JSON under this definition's key.
 *
 * @property int $id
 * @property string $entity
 * @property string $key
 * @property string $label
 * @property CustomFieldType $type
 * @property list<string>|null $options
 * @property bool $required
 * @property int $position
 * @property bool $active
 */
#[Fillable(['entity', 'key', 'label', 'type', 'options', 'required', 'position', 'active'])]
class FieldDefinition extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['type' => CustomFieldType::class, 'options' => 'array', 'required' => 'boolean', 'active' => 'boolean'];
    }

    /**
     * Active fields for one record type, in display order.
     *
     * @return Collection<int, FieldDefinition>
     */
    public static function activeFor(string $entity): Collection
    {
        return self::where('entity', $entity)->where('active', true)->orderBy('position')->orderBy('id')->get();
    }

    /**
     * Validation rules for this field's value.
     *
     * @return list<mixed>
     */
    public function rules(): array
    {
        return [
            $this->required ? 'required' : 'nullable',
            ...match ($this->type) {
                CustomFieldType::Text => ['string', 'max:255'],
                CustomFieldType::Textarea => ['string', 'max:5000'],
                CustomFieldType::Number => ['numeric', 'max:999999999999'],
                CustomFieldType::Date => ['date'],
                CustomFieldType::Checkbox => ['boolean'],
                CustomFieldType::Select => [Rule::in($this->options ?? [])],
            },
        ];
    }

    /**
     * The value as stored: numbers as numbers, yes/no as booleans.
     */
    public function normalize(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        return match ($this->type) {
            CustomFieldType::Number => $value + 0,
            CustomFieldType::Checkbox => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            default => $value,
        };
    }
}
