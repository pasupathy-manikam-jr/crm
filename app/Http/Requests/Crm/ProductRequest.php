<?php

namespace App\Http\Requests\Crm;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage-catalog');
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['active' => $this->input('active', 'active') === 'active']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Product|null $product */
        $product = $this->route('product');

        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:64', Rule::unique(Product::class)->ignore($product?->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit_price' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['sku' => __('SKU'), 'unit_price' => __('price'), 'tax_rate' => __('tax rate')];
    }
}
