<?php

namespace App\Http\Requests\Users;

use App\Models\Webhook;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WebhookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage-users');
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['active' => $this->input('active', '1') === '1']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'url' => ['required', 'url:http,https', 'max:2048', function (string $attribute, mixed $value, Closure $fail): void {
                if (is_string($value) && ! Webhook::isAllowedUrl($value)) {
                    $fail(__('Use a public http(s) address; private and local network addresses are not allowed.'));
                }
            }],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['required', Rule::in(Webhook::events())],
            'active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['events.required' => __('Pick at least one event.')];
    }
}
