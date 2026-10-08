<?php

namespace Database\Factories;

use App\Enums\CasePriority;
use App\Models\SupportCase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupportCase>
 */
class SupportCaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject' => fake()->sentence(5),
            'description' => fake()->paragraph(),
            'priority' => fake()->randomElement(CasePriority::cases()),
            'status' => 'open',
            'owner_id' => User::factory(),
        ];
    }
}
