<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Something the business sells, picked onto quote lines.
 *
 * @property int $id
 * @property string $name
 * @property string|null $sku
 * @property string|null $description
 * @property string $unit_price
 * @property string $tax_rate
 * @property bool $active
 */
#[Fillable(['name', 'sku', 'description', 'unit_price', 'tax_rate', 'active'])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'tax_rate' => 'decimal:2', 'active' => 'boolean'];
    }
}
