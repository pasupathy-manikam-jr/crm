<?php

namespace App\Http\Requests\Crm;

use App\Concerns\RecordReferenceRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SendEmailRequest extends FormRequest
{
    use RecordReferenceRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->recordReferenceRules('regarding_type', 'regarding_id', required: true),
            'to' => ['required', 'email', 'max:255'],
            'cc' => ['nullable', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:200'],
            'body' => ['required', 'string', 'max:20000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['to' => __('recipient'), 'body' => __('message')];
    }
}
