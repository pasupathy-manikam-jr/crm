<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Model;

/**
 * The id names a record the current user can see. Owned models apply their visibility
 * scope to every query, so a record outside the user's view fails like a missing one.
 */
class Visible implements ValidationRule
{
    /**
     * @param  class-string<Model>  $model
     */
    public function __construct(private string $model, private string $message) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_numeric($value) || ! $this->model::query()->whereKey((int) $value)->exists()) {
            $fail(__($this->message));
        }
    }
}
