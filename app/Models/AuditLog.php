<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One entry in a record's history, written by the CrmRecord trait.
 *
 * @property int $id
 * @property string $auditable_type
 * @property int $auditable_id
 * @property string $event
 * @property array<string, array{0: mixed, 1: mixed}>|null $changes
 * @property int|null $user_id
 * @property CarbonInterface|null $created_at
 */
#[Fillable(['auditable_type', 'auditable_id', 'event', 'changes', 'user_id'])]
class AuditLog extends Model
{
    const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['changes' => 'array'];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
