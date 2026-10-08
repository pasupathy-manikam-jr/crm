<?php

namespace App\Http\Requests\Crm;

use App\Concerns\OwnerValidationRules;
use App\Concerns\RecordReferenceRules;
use App\Enums\ActivityType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActivityRequest extends FormRequest
{
    use OwnerValidationRules, RecordReferenceRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ActivityType::class)],
            'subject' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'due_at' => ['nullable', 'date'],
            ...$this->recordReferenceRules('regarding_type', 'regarding_id', required: false),
            'owner_id' => $this->ownerRules($this->user()),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['owner_id' => __('assignee'), 'due_at' => __('due date')];
    }
}
