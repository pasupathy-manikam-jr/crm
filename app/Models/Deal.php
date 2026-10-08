<?php

namespace App\Models;

use App\Enums\StageKind;
use App\Models\Concerns\CrmRecord;
use App\Models\Concerns\Owned;
use Carbon\CarbonInterface;
use Database\Factories\DealFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * An opportunity: money that may come in from an account, moving through stages.
 *
 * @property int $id
 * @property string $name
 * @property int|null $account_id
 * @property int|null $contact_id
 * @property int $stage_id
 * @property string $amount
 * @property int $probability
 * @property CarbonInterface|null $expected_close_date
 * @property CarbonInterface|null $closed_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 */
#[Fillable(['name', 'account_id', 'contact_id', 'stage_id', 'amount', 'probability', 'expected_close_date', 'owner_id'])]
class Deal extends Model
{
    /** @use HasFactory<DealFactory> */
    use CrmRecord, HasFactory, Owned, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expected_close_date' => 'date:Y-m-d',
            'closed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Entering a stage takes its probability unless one was given; won/lost close the deal.
        static::saving(function (Deal $deal): void {
            if (! $deal->isDirty('stage_id')) {
                return;
            }

            $stage = Stage::findOrFail($deal->stage_id);

            if (! $deal->isDirty('probability')) {
                $deal->probability = $stage->probability;
            }

            $deal->closed_at = $stage->kind === StageKind::Open ? null : ($deal->closed_at ?? now());
        });
    }

    /**
     * Move the deal to another stage, taking that stage's probability.
     */
    public function moveTo(Stage $stage): void
    {
        $this->stage_id = $stage->id;
        $this->save();
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * @return BelongsTo<Contact, $this>
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * @return BelongsTo<Stage, $this>
     */
    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }
}
