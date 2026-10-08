<?php

namespace App\Http\Requests\Users;

use App\Concerns\NullsNoneSelections;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Creating or editing a user from the admin Users page.
 */
class UserRequest extends FormRequest
{
    use NullsNoneSelections, ProfileValidationRules;

    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage-users');
    }

    protected function prepareForValidation(): void
    {
        $this->nullNoneSelections(['team_id']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $editing */
        $editing = $this->route('user');
        $isSelf = $editing !== null && $editing->is($this->user());

        return [
            ...$this->profileRules($editing?->id),
            'role' => [
                'required',
                Rule::enum(UserRole::class),
                // An admin can't take away their own admin access and lock themselves out.
                ...($isSelf ? [Rule::in([UserRole::Admin->value])] : []),
            ],
            'team_id' => ['nullable', 'integer', Rule::exists(Team::class, 'id')],
            'password' => [$editing === null ? 'required' : 'nullable', 'string', Password::default()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['role.in' => __('You can\'t remove your own admin role.')];
    }
}
