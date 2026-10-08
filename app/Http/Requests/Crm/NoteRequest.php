<?php

namespace App\Http\Requests\Crm;

use App\Concerns\RecordReferenceRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class NoteRequest extends FormRequest
{
    use RecordReferenceRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->recordReferenceRules('notable_type', 'notable_id', required: true),
            'body' => ['required', 'string', 'max:10000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['body' => __('note')];
    }
}
