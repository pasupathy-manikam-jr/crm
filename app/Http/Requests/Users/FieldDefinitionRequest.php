<?php

namespace App\Http\Requests\Users;

use App\Enums\CustomFieldType;
use App\Models\FieldDefinition;
use App\Support\CrmRecords;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Adding or editing a custom field. Record type and field type are fixed once created,
 * so stored values never change meaning.
 */
class FieldDefinitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage-users');
    }

    protected function prepareForValidation(): void
    {
        $options = collect(preg_split('/\r?\n/', (string) $this->input('options')) ?: [])->map(fn (string $o) => trim($o))->filter()->unique()->values()->all();

        $this->merge([
            'options' => $options,
            'required' => $this->input('required') === 'yes',
            'active' => $this->input('active', 'active') === 'active',
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var FieldDefinition|null $field */
        $field = $this->route('field');
        $creating = $field === null;
        $type = $creating ? $this->input('type') : $field->type->value;

        return [
            'entity' => $creating ? ['required', Rule::in(array_keys(CrmRecords::TYPES))] : ['prohibited'],
            'type' => $creating ? ['required', Rule::enum(CustomFieldType::class)] : ['prohibited'],
            'label' => ['required', 'string', 'max:100'],
            'options' => $type === CustomFieldType::Select->value ? ['required', 'array', 'min:1', 'max:100'] : ['array', 'max:0'],
            'options.*' => ['string', 'max:100'],
            'required' => ['boolean'],
            'active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['options.required' => __('List at least one choice, one per line.'), 'options.max' => __('Only dropdown fields have choices.')];
    }
}
