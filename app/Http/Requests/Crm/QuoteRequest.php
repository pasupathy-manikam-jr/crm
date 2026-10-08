<?php

namespace App\Http\Requests\Crm;

use App\Concerns\NullsNoneSelections;
use App\Concerns\OwnerValidationRules;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Product;
use App\Rules\Visible;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuoteRequest extends FormRequest
{
    use NullsNoneSelections, OwnerValidationRules;

    protected function prepareForValidation(): void
    {
        $this->nullNoneSelections(['account_id', 'contact_id', 'deal_id']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'account_id' => ['nullable', new Visible(Account::class, 'Choose one of your accounts.')],
            'contact_id' => ['nullable', new Visible(Contact::class, 'Choose one of your contacts.')],
            'deal_id' => ['nullable', new Visible(Deal::class, 'Choose one of your deals.')],
            'valid_until' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'owner_id' => $this->ownerRules($this->user()),
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.product_id' => ['nullable', 'integer', Rule::exists(Product::class, 'id')],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:9999999'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => __('Add at least one line.'),
            'items.*.description.required' => __('Describe this line.'),
            'items.*.quantity.gt' => __('Quantity must be more than 0.'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['items.*.quantity' => __('quantity'), 'items.*.unit_price' => __('price'), 'items.*.discount_percent' => __('discount'), 'items.*.tax_rate' => __('tax')];
    }
}
