<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\In;

trait OwnerValidationRules
{
    /**
     * A record's owner must be someone whose records the current user can see,
     * so a sales rep can't hand a record to another team.
     *
     * @return array<int, ValidationRule|array<mixed>|string|In>
     */
    protected function ownerRules(User $user): array
    {
        return ['required', 'integer', Rule::in($user->assignableOwners()->modelKeys())];
    }
}
