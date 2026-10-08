<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['GPS tracker unit', 'Fleet software licence (per vehicle / yr)', 'Installation (per site)', 'Pallet racking bay', 'Temperature sensor', 'Support plan (annual)', 'Barcode scanner', 'Training day']).' '.fake()->unique()->numerify('##'),
            'sku' => fake()->unique()->bothify('SKU-####'),
            'unit_price' => fake()->randomFloat(2, 80, 4800),
            'tax_rate' => fake()->randomElement([0, 6, 8]),
            'active' => true,
        ];
    }
}
