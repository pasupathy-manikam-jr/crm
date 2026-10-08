<?php

namespace App\Http\Requests\Crm;

use App\Concerns\CustomFieldRules;
use App\Concerns\NullsNoneSelections;
use App\Concerns\OwnerValidationRules;
use App\Enums\CasePriority;
use App\Enums\CaseStatus;
use App\Models\Account;
use App\Models\Contact;
use App\Rules\Visible;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupportCaseRequest extends FormRequest
{
    use CustomFieldRules, NullsNoneSelections, OwnerValidationRules;

    protected function prepareForValidation(): void
    {
        $this->nullNoneCustomFields();
        $this->nullNoneSelections(['account_id', 'contact_id']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'account_id' => ['nullable', new Visible(Account::class, 'Choose one of your accounts.')],
            'contact_id' => ['nullable', new Visible(Contact::class, 'Choose one of your contacts.')],
            'priority' => ['required', Rule::enum(CasePriority::class)],
            'status' => ['required', Rule::enum(CaseStatus::class)],
            'owner_id' => $this->ownerRules($this->user()),
            ...$this->customFieldRules('case'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->customFieldAttributes('case');
    }
}
