<?php

namespace Database\Factories;

use App\Models\WorkflowRule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkflowRule>
 */
class WorkflowRuleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'module' => 'lead',
            'event' => 'created',
            'conditions' => [],
            'actions' => [],
            'active' => true,
        ];
    }
}
