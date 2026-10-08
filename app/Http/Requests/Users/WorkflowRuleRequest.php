<?php

namespace App\Http\Requests\Users;

use App\Support\Workflows;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WorkflowRuleRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'active' => $this->boolean('active'),
            'conditions' => array_values((array) $this->input('conditions', [])),
            'actions' => array_values((array) $this->input('actions', [])),
        ]);
    }

    /**
     * Rules for the chosen module, plus per-action rules for each action's type.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $definitions = Workflows::definitions();
        $module = $definitions[(string) $this->input('module')] ?? ['fields' => [], 'actions' => []];
        $fields = collect($module['fields'])->keyBy('key');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'module' => ['required', Rule::in(array_keys($definitions))],
            'event' => ['required', Rule::in(array_keys(Workflows::EVENTS))],
            'active' => ['boolean'],
            'conditions' => ['array', 'max:10'],
            'conditions.*.field' => ['required', Rule::in($fields->keys()->all())],
            'conditions.*.operator' => ['required', Rule::in(array_keys(Workflows::OPERATORS))],
            'conditions.*.value' => ['nullable', 'string', 'max:255', 'required_unless:conditions.*.operator,'.implode(',', Workflows::UNARY)],
            'actions' => ['required', 'array', 'min:1', 'max:10'],
            'actions.*.type' => ['required', Rule::in($module['actions'])],
        ];

        foreach ((array) $this->input('actions', []) as $i => $action) {
            $type = is_array($action) ? ($action['type'] ?? null) : null;

            $rules += match ($type) {
                'set_field' => [
                    "actions.{$i}.field" => ['required', Rule::in($fields->where('settable', true)->keys()->all())],
                    "actions.{$i}.value" => $this->valueRules($fields->get($action['field'] ?? '')),
                ],
                'create_task' => [
                    "actions.{$i}.subject" => ['required', 'string', 'max:255'],
                    "actions.{$i}.due_in_days" => ['nullable', 'integer', 'min:0', 'max:365'],
                ],
                'send_email' => [
                    "actions.{$i}.to" => ['required', 'string', 'max:255', function (string $attribute, mixed $value, Closure $fail): void {
                        if (! in_array($value, ['owner', 'record'], true) && filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
                            $fail(__('Send to the owner, the record’s contact, or a valid email address.'));
                        }
                    }],
                    "actions.{$i}.subject" => ['required', 'string', 'max:255'],
                    "actions.{$i}.body" => ['required', 'string', 'max:5000'],
                ],
                default => [],
            };
        }

        return $rules;
    }

    /**
     * What Set field may write into a field of its type.
     *
     * @param  array{type: string, options?: list<array{value: string, label: string}>}|null  $field
     * @return list<mixed>
     */
    private function valueRules(?array $field): array
    {
        return match ($field['type'] ?? null) {
            'select' => ['required', Rule::in(array_column($field['options'] ?? [], 'value'))],
            'number' => ['required', 'numeric'],
            'date' => ['required', 'date_format:Y-m-d'],
            default => ['nullable', 'string', 'max:255'],
        };
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'conditions.*.field' => __('field'),
            'conditions.*.operator' => __('test'),
            'conditions.*.value' => __('value'),
            'actions.*.type' => __('action'),
            'actions.*.field' => __('field'),
            'actions.*.value' => __('value'),
            'actions.*.subject' => __('subject'),
            'actions.*.to' => __('recipient'),
            'actions.*.body' => __('message'),
            'actions.*.due_in_days' => __('due in'),
        ];
    }
}
