<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One line of a quote. line_total is the net amount (after discount, before tax).
 *
 * @property int $id
 * @property int $quote_id
 * @property int|null $product_id
 * @property int $position
 * @property string $description
 * @property string $quantity
 * @property string $unit_price
 * @property string $discount_percent
 * @property string $tax_rate
 * @property string $line_total
 */
#[Fillable(['product_id', 'position', 'description', 'quantity', 'unit_price', 'discount_percent', 'tax_rate', 'line_total'])]
class QuoteItem extends Model
{
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
