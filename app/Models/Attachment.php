<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

/**
 * A file on a record, kept on the private disk. Who may download it follows the record.
 *
 * @property int $id
 * @property string $attachable_type
 * @property int $attachable_id
 * @property string $name
 * @property string $path
 * @property string|null $mime_type
 * @property int $size
 * @property int|null $user_id
 * @property CarbonInterface|null $created_at
 */
#[Fillable(['attachable_type', 'attachable_id', 'name', 'path', 'mime_type', 'size', 'user_id'])]
#[Hidden(['path'])]
class Attachment extends Model
{
    protected static function booted(): void
    {
        // The file goes with its row.
        static::deleted(fn (Attachment $attachment) => Storage::disk('local')->delete($attachment->path));
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
