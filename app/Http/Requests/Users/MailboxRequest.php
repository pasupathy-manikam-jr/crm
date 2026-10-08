<?php

namespace App\Http\Requests\Users;

use App\Models\Mailbox;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MailboxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage-users');
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'create_cases' => $this->input('create_cases') === '1',
            'draft_quotes' => $this->input('draft_quotes') === '1',
            'active' => $this->input('active') === '1',
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Mailbox|null $mailbox */
        $mailbox = $this->route('mailbox');

        return [
            'name' => ['required', 'string', 'max:100'],
            'host' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z0-9.-]+$/'],
            'port' => ['required', 'integer', 'between:1,65535'],
            'encryption' => ['required', Rule::in(['ssl', 'tls', 'none'])],
            'username' => ['required', 'string', 'max:255'],
            // Left blank when editing: keep the stored password.
            'password' => [$mailbox ? 'nullable' : 'required', 'string', 'max:500'],
            'folder' => ['required', 'string', 'max:255'],
            'create_cases' => ['boolean'],
            'draft_quotes' => ['boolean'],
            'owner_id' => ['required', Rule::exists(User::class, 'id')],
            'allowed_domains' => ['nullable', 'string', 'max:5000'],
            'blocked_domains' => ['nullable', 'string', 'max:5000'],
            'active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['owner_id' => __('owner'), 'host' => __('IMAP server')];
    }
}
