<?php

namespace App\Http\Requests\Crm;

use App\Concerns\CustomFieldRules;
use App\Concerns\NullsNoneSelections;
use App\Concerns\OwnerValidationRules;
use App\Models\Account;
use App\Rules\Visible;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ContactRequest extends FormRequest
{
    use CustomFieldRules, NullsNoneSelections, OwnerValidationRules;

    protected function prepareForValidation(): void
    {
        $this->nullNoneCustomFields();
        $this->nullNoneSelections(['account_id']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'account_id' => ['nullable', new Visible(Account::class, 'Choose one of your accounts.')],
            'owner_id' => $this->ownerRules($this->user()),
            ...$this->customFieldRules('contact'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->customFieldAttributes('contact');
    }
}
