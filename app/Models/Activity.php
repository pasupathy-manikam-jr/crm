<?php

namespace App\Models;

use App\Enums\ActivityType;
use App\Models\Concerns\Owned;
use Carbon\CarbonInterface;
use Database\Factories\ActivityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A call, meeting or task, assigned to its owner and optionally about one record.
 *
 * @property int $id
 * @property ActivityType $type
 * @property string $subject
 * @property string|null $notes
 * @property CarbonInterface|null $due_at
 * @property CarbonInterface|null $done_at
 * @property string|null $regarding_type
 * @property int|null $regarding_id
 * @property CarbonInterface|null $created_at
 */
#[Fillable(['type', 'subject', 'notes', 'due_at', 'regarding_type', 'regarding_id', 'owner_id'])]
class Activity extends Model
{
    /** @use HasFactory<ActivityFactory> */
    use HasFactory, Owned, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ActivityType::class,
            'due_at' => 'datetime',
            'done_at' => 'datetime',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function regarding(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Open activities due before today.
     *
     * @param  Builder<Activity>  $query
     */
    public function scopeOverdue(Builder $query): void
    {
        $query->whereNull('done_at')->where('due_at', '<', today());
    }

    /**
     * Open activities due today or earlier: what the top-bar badge counts.
     *
     * @param  Builder<Activity>  $query
     */
    public function scopeNeedsAttention(Builder $query): void
    {
        $query->whereNull('done_at')->where('due_at', '<', today()->addDay());
    }
}
