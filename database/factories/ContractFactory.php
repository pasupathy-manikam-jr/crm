<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Contract;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contract>
 */
class ContractFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = today()->subMonths(fake()->numberBetween(1, 11));

        return [
            'name' => fake()->randomElement(['Annual support', 'Fleet tracking subscription', 'Maintenance plan', 'SaaS licence']).' '.$start->year,
            'account_id' => Account::factory(),
            'status' => 'active',
            'start_date' => $start->toDateString(),
            'end_date' => $start->addYear()->subDay()->toDateString(),
            'value' => fake()->randomFloat(2, 2000, 80000),
            'renewal_terms' => 'Renews yearly; 30 days written notice to cancel.',
            'notice_days' => 30,
            'owner_id' => User::factory(),
        ];
    }
}
