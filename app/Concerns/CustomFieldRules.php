<?php

namespace App\Concerns;

use App\Models\FieldDefinition;

/**
 * For a record's form request: rules for its active custom fields, sent as custom_fields[key].
 */
trait CustomFieldRules
{
    /**
     * Pickers post "none" for an empty choice; treat it as no value.
     */
    protected function nullNoneCustomFields(): void
    {
        $custom = $this->input('custom_fields');

        if (is_array($custom)) {
            $this->merge(['custom_fields' => array_map(fn ($v) => $v === 'none' ? null : $v, $custom)]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function customFieldRules(string $entity): array
    {
        $rules = ['custom_fields' => ['nullable', 'array']];

        foreach (FieldDefinition::activeFor($entity) as $field) {
            $rules["custom_fields.{$field->key}"] = $field->rules();
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    protected function customFieldAttributes(string $entity): array
    {
        return FieldDefinition::activeFor($entity)->mapWithKeys(fn (FieldDefinition $f) => ["custom_fields.{$f->key}" => $f->label])->all();
    }
}
