<?php

namespace Database\Factories;

use App\Models\Deal;
use App\Models\Stage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Deal>
 */
class DealFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Fleet tracking rollout', 'Warehouse racking', 'Annual support renewal', 'Branch network refresh', 'POS terminals', 'Cold-chain sensors', 'ERP integration', 'Staff training programme']),
            'stage_id' => Stage::factory(),
            'amount' => fake()->randomFloat(2, 1500, 180000),
            'expected_close_date' => fake()->dateTimeBetween('-1 month', '+3 months')->format('Y-m-d'),
            'owner_id' => User::factory(),
        ];
    }
}
