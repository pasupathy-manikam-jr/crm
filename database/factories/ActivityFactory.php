<?php

namespace Database\Factories;

use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(ActivityType::cases()),
            'subject' => fake()->randomElement(['Follow up on quotation', 'Discovery call', 'Send product brochure', 'Site visit', 'Confirm delivery date', 'Contract review meeting', 'Check payment status']),
            'notes' => null,
            'due_at' => fake()->dateTimeBetween('-5 days', '+10 days'),
            'owner_id' => User::factory(),
        ];
    }
}
