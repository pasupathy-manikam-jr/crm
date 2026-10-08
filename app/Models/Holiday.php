<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A day off: case SLA clocks skip it (see App\Support\BusinessHours).
 *
 * @property int $id
 * @property CarbonInterface $date
 * @property string $name
 */
#[Fillable(['date', 'name'])]
class Holiday extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d'];
    }
}
