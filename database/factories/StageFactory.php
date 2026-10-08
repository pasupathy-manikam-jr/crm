<?php

namespace Database\Factories;

use App\Enums\StageKind;
use App\Models\Stage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stage>
 */
class StageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'position' => fake()->numberBetween(1, 9),
            'probability' => 50,
            'kind' => StageKind::Open,
        ];
    }
}
