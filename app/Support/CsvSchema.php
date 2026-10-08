<?php

namespace App\Support;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Models\Account;
use App\Models\Contact;
use App\Models\FieldDefinition;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

/**
 * What CSV import and export know about each record type: its columns (label and
 * import rules) and which columns the list search box matches.
 */
final class CsvSchema
{
    public const TYPES = ['accounts', 'contacts', 'leads'];

    /**
     * @return class-string<Model>
     */
    public static function model(string $type): string
    {
        return match ($type) {
            'accounts' => Account::class,
            'contacts' => Contact::class,
            default => Lead::class,
        };
    }

    /**
     * Importable fields: field => [label, validation rules], then active custom fields as
     * "custom:<key>". "account" on contacts is matched to a visible account by name.
     *
     * @return array<string, array{0: string, 1: list<mixed>}>
     */
    public static function fields(string $type): array
    {
        $text = ['nullable', 'string', 'max:255'];

        $custom = [];
        foreach (FieldDefinition::activeFor(rtrim($type, 's')) as $field) {
            $custom["custom:{$field->key}"] = [$field->label, $field->rules()];
        }

        return [...match ($type) {
            'accounts' => [
                'name' => ['Company name', ['required', 'string', 'max:255']],
                'industry' => ['Industry', $text],
                'website' => ['Website', ['nullable', 'url', 'max:255']],
                'phone' => ['Phone', ['nullable', 'string', 'max:50']],
                'email' => ['Email', ['nullable', 'email', 'max:255']],
                'billing_address' => ['Billing address', ['nullable', 'string', 'max:1000']],
                'shipping_address' => ['Shipping address', ['nullable', 'string', 'max:1000']],
            ],
            'contacts' => [
                'first_name' => ['First name', ['required', 'string', 'max:255']],
                'last_name' => ['Last name', ['required', 'string', 'max:255']],
                'job_title' => ['Job title', $text],
                'email' => ['Email', ['nullable', 'email', 'max:255']],
                'phone' => ['Phone', ['nullable', 'string', 'max:50']],
                'account' => ['Account', $text],
            ],
            default => [
                'first_name' => ['First name', ['required', 'string', 'max:255']],
                'last_name' => ['Last name', ['required', 'string', 'max:255']],
                'company' => ['Company', $text],
                'job_title' => ['Job title', $text],
                'email' => ['Email', ['nullable', 'email', 'max:255']],
                'phone' => ['Phone', ['nullable', 'string', 'max:50']],
                'source' => ['Source', ['nullable', Rule::enum(LeadSource::class)]],
                'status' => ['Status', ['nullable', Rule::enum(LeadStatus::class)->except(LeadStatus::Converted)]],
            ],
        }, ...$custom];
    }

    /**
     * @return list<string>
     */
    public static function searchable(string $type): array
    {
        return match ($type) {
            'accounts' => ['name', 'email', 'phone', 'industry'],
            'contacts' => ['first_name', 'last_name', 'email', 'phone', 'job_title'],
            default => ['first_name', 'last_name', 'company', 'email', 'phone'],
        };
    }
}
