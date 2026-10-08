<?php

namespace App\Http\Requests\Crm;

use App\Concerns\CustomFieldRules;
use App\Concerns\NullsNoneSelections;
use App\Concerns\OwnerValidationRules;
use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Models\Lead;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeadRequest extends FormRequest
{
    use CustomFieldRules, NullsNoneSelections, OwnerValidationRules;

    protected function prepareForValidation(): void
    {
        $this->nullNoneCustomFields();
        $this->nullNoneSelections(['source']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Lead|null $lead */
        $lead = $this->route('lead');

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'source' => ['nullable', Rule::enum(LeadSource::class)],
            // Only conversion sets "converted", and a converted lead keeps it.
            'status' => ['required', $lead?->isConverted()
                ? Rule::in([LeadStatus::Converted->value])
                : Rule::enum(LeadStatus::class)->except(LeadStatus::Converted)],
            'owner_id' => $this->ownerRules($this->user()),
            ...$this->customFieldRules('lead'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->customFieldAttributes('lead');
    }
}
