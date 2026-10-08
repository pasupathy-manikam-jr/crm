<?php

namespace App\Concerns;

/**
 * For form requests: a select can't post an empty option, so pickers post "none"
 * for "no choice". This turns those into null before validation.
 */
trait NullsNoneSelections
{
    /**
     * @param  list<string>  $fields
     */
    protected function nullNoneSelections(array $fields): void
    {
        foreach ($fields as $field) {
            if ($this->input($field) === 'none') {
                $this->merge([$field => null]);
            }
        }
    }
}
