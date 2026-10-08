<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * A lead-capture form embedded on the company website; each submission becomes a lead.
 *
 * @property int $id
 * @property string $name
 * @property string $token
 * @property int $owner_id
 * @property string|null $redirect_url
 * @property bool $active
 * @property int $submissions
 */
#[Fillable(['name', 'owner_id', 'redirect_url', 'active'])]
#[Hidden(['token'])]
class WebForm extends Model
{
    protected static function booted(): void
    {
        static::creating(fn (WebForm $form) => $form->token ??= Str::random(40));
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
