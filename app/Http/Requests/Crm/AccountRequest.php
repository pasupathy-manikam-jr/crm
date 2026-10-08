<?php

namespace App\Http\Requests\Crm;

use App\Concerns\CustomFieldRules;
use App\Concerns\OwnerValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AccountRequest extends FormRequest
{
    use CustomFieldRules, OwnerValidationRules;

    protected function prepareForValidation(): void
    {
        $this->nullNoneCustomFields();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'billing_address' => ['nullable', 'string', 'max:1000'],
            'shipping_address' => ['nullable', 'string', 'max:1000'],
            'owner_id' => $this->ownerRules($this->user()),
            ...$this->customFieldRules('account'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->customFieldAttributes('account');
    }
}
