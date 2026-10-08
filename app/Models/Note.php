<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\NoteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A note on a record. Who may see it follows the record it is on.
 *
 * @property int $id
 * @property string $notable_type
 * @property int $notable_id
 * @property string $body
 * @property int|null $user_id
 * @property CarbonInterface|null $created_at
 */
#[Fillable(['notable_type', 'notable_id', 'body', 'user_id'])]
class Note extends Model
{
    /** @use HasFactory<NoteFactory> */
    use HasFactory;

    /**
     * @return MorphTo<Model, $this>
     */
    public function notable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
