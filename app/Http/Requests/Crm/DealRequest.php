<?php

namespace App\Http\Requests\Crm;

use App\Concerns\CustomFieldRules;
use App\Concerns\NullsNoneSelections;
use App\Concerns\OwnerValidationRules;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Stage;
use App\Rules\Visible;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DealRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'account_id' => ['nullable', new Visible(Account::class, 'Choose one of your accounts.')],
            'contact_id' => ['nullable', new Visible(Contact::class, 'Choose one of your contacts.')],
            'stage_id' => ['required', 'integer', Rule::exists(Stage::class, 'id')],
            'amount' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'expected_close_date' => ['nullable', 'date'],
            'owner_id' => $this->ownerRules($this->user()),
            ...$this->customFieldRules('deal'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->customFieldAttributes('deal');
    }
}
