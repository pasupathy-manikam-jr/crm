<?php

namespace Database\Factories;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'company' => fake()->company(),
            'job_title' => fake()->jobTitle(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'source' => fake()->randomElement(LeadSource::cases()),
            // Converted is set only by ConvertLead, never by a factory.
            'status' => fake()->randomElement(array_filter(LeadStatus::cases(), fn (LeadStatus $s) => $s !== LeadStatus::Converted)),
            'owner_id' => User::factory(),
        ];
    }
}
