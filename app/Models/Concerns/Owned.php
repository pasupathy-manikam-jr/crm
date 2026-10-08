<?php

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * A record with an owner. While a user is signed in, every query on the model only
 * returns the records their role lets them see (see User::visibleOwnerIds()), so a
 * record outside that set is a 404 rather than a 403. Console and queue code run
 * without a user and see everything.
 *
 * @property int $owner_id
 */
trait Owned
{
    public static function bootOwned(): void
    {
        static::addGlobalScope('visible', function (Builder $query): void {
            $user = Auth::user();

            if ($user instanceof User && ($ids = $user->visibleOwnerIds()) !== null) {
                $query->whereIn($query->qualifyColumn('owner_id'), $ids);
            }
        });

        static::creating(function (self $record): void {
            if (! isset($record->owner_id) && Auth::id() !== null) {
                $record->owner_id = (int) Auth::id();
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
