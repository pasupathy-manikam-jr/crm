<?php

namespace Database\Factories;

use App\Models\Note;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'body' => fake()->randomElement([
                'Prefers WhatsApp over email. Best reached after 3pm.',
                'Budget approved for Q1. Decision maker is the operations director.',
                'Asked for a revised quote with a 3-year support term.',
                'Using a competitor today; contract ends in March.',
            ]),
            'user_id' => User::factory(),
        ];
    }
}
