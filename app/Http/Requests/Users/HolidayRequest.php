<?php

namespace App\Http\Requests\Users;

use App\Models\Holiday;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage-users');
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Holiday|null $holiday */
        $holiday = $this->route('holiday');

        return [
            'date' => ['required', 'date_format:Y-m-d', Rule::unique(Holiday::class)->ignore($holiday?->id)],
            'name' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['date.unique' => __('That day is already a holiday.')];
    }
}
