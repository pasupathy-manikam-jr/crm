<?php

namespace App\Http\Requests\Users;

use App\Models\Team;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TeamRequest extends FormRequest
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
        /** @var Team|null $team */
        $team = $this->route('team');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique(Team::class)->ignore($team?->id)],
        ];
    }
}
