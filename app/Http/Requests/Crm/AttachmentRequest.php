<?php

namespace App\Http\Requests\Crm;

use App\Concerns\RecordReferenceRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class AttachmentRequest extends FormRequest
{
    use RecordReferenceRules;

    /**
     * Office documents, PDFs, images, text and zip files up to 10 MB. Anything executable is refused.
     */
    public const EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'zip'];

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->recordReferenceRules('attachable_type', 'attachable_id', required: true),
            'file' => ['required', File::types(self::EXTENSIONS)->max(10 * 1024)],
        ];
    }
}
