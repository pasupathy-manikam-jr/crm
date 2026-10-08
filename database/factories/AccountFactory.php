<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'industry' => fake()->randomElement(['Manufacturing', 'Retail', 'Healthcare', 'Logistics', 'Construction', 'Education', 'Hospitality']),
            'website' => 'https://'.fake()->domainName(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'billing_address' => fake()->address(),
            'shipping_address' => null,
            'owner_id' => User::factory(),
        ];
    }
}
