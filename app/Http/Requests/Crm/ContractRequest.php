<?php

namespace App\Http\Requests\Crm;

use App\Concerns\CustomFieldRules;
use App\Concerns\NullsNoneSelections;
use App\Concerns\OwnerValidationRules;
use App\Enums\ContractStatus;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Quote;
use App\Rules\Visible;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContractRequest extends FormRequest
{
    use CustomFieldRules, NullsNoneSelections, OwnerValidationRules;

    protected function prepareForValidation(): void
    {
        $this->nullNoneCustomFields();
        $this->nullNoneSelections(['contact_id', 'quote_id']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'account_id' => ['required', new Visible(Account::class, 'Choose one of your accounts.')],
            'contact_id' => ['nullable', new Visible(Contact::class, 'Choose one of your contacts.')],
            'quote_id' => ['nullable', new Visible(Quote::class, 'Choose one of your quotes.')],
            'status' => ['required', Rule::enum(ContractStatus::class)],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after:start_date'],
            'value' => ['required', 'numeric', 'min:0', 'max:999999999999'],
            'renewal_terms' => ['nullable', 'string', 'max:5000'],
            'notice_days' => ['required', 'integer', 'min:0', 'max:365'],
            'owner_id' => $this->ownerRules($this->user()),
            ...$this->customFieldRules('contract'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [...$this->customFieldAttributes('contract'), 'notice_days' => __('reminder days')];
    }
}
