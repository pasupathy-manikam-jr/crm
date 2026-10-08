<?php

namespace App\Models;

use App\Enums\StageKind;
use Database\Factories\StageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A step in the sales pipeline. Moving a deal here sets its probability; won and
 * lost stages close it.
 *
 * @property int $id
 * @property string $name
 * @property int $position
 * @property int $probability
 * @property StageKind $kind
 */
#[Fillable(['name', 'position', 'probability', 'kind'])]
class Stage extends Model
{
    /** @use HasFactory<StageFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['kind' => StageKind::class];
    }

    /**
     * @return HasMany<Deal, $this>
     */
    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }
}
