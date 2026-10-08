<?php

namespace App\Http\Requests\Crm;

use App\Models\Account;
use App\Models\Stage;
use App\Rules\Visible;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Turning a lead into an account (new or existing), a contact and, optionally, a deal.
 */
class ConvertLeadRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['create_deal' => $this->boolean('create_deal')]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'account_mode' => ['required', Rule::in(['new', 'existing'])],
            'account_name' => ['exclude_unless:account_mode,new', 'required', 'string', 'max:255'],
            'account_id' => ['exclude_unless:account_mode,existing', 'required', new Visible(Account::class, 'Choose one of your accounts.')],
            'create_deal' => ['boolean'],
            'deal_name' => ['exclude_unless:create_deal,true', 'required', 'string', 'max:255'],
            'deal_amount' => ['exclude_unless:create_deal,true', 'required', 'numeric', 'min:0', 'max:999999999999.99'],
            'stage_id' => ['exclude_unless:create_deal,true', 'required', 'integer', Rule::exists(Stage::class, 'id')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['account_name' => __('account name'), 'deal_name' => __('deal name'), 'deal_amount' => __('amount'), 'stage_id' => __('stage')];
    }
}
