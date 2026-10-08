<?php

namespace App\Concerns;

use App\Rules\Visible;
use App\Support\CrmRecords;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\In;

/**
 * For form requests that point at a CRM record by type alias + id: the type must be
 * known and the record one the current user can see.
 */
trait RecordReferenceRules
{
    /**
     * @return array<string, array<int, ValidationRule|string|In>>
     */
    protected function recordReferenceRules(string $typeField, string $idField, bool $required): array
    {
        $model = CrmRecords::TYPES[(string) $this->input($typeField)] ?? null;

        return [
            $typeField => [$required ? 'required' : 'nullable', Rule::in(array_keys(CrmRecords::TYPES))],
            $idField => [
                $required ? 'required' : 'nullable',
                "required_with:{$typeField}",
                ...($model ? [new Visible($model, 'Choose a record you can see.')] : []),
            ],
        ];
    }
}
