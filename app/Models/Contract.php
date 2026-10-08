<?php

namespace App\Models;

use App\Enums\ContractStatus;
use App\Models\Concerns\CrmRecord;
use App\Models\Concerns\Owned;
use Carbon\CarbonInterface;
use Database\Factories\ContractFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * An agreement with an account for a period and value. A reminder goes out notice_days
 * before end_date, and it can be renewed into a new deal.
 *
 * @property int $id
 * @property string $name
 * @property int $account_id
 * @property int|null $contact_id
 * @property int|null $quote_id
 * @property ContractStatus $status
 * @property CarbonInterface $start_date
 * @property CarbonInterface $end_date
 * @property string $value
 * @property string|null $renewal_terms
 * @property int $notice_days
 * @property CarbonInterface|null $reminded_at
 * @property int|null $renewal_deal_id
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 */
#[Fillable(['name', 'account_id', 'contact_id', 'quote_id', 'status', 'start_date', 'end_date', 'value', 'renewal_terms', 'notice_days', 'owner_id'])]
class Contract extends Model
{
    /** @use HasFactory<ContractFactory> */
    use CrmRecord, HasFactory, Owned, SoftDeletes;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = ['status' => 'draft', 'notice_days' => 30];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ContractStatus::class,
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'value' => 'decimal:2',
            'reminded_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // A new end date (or notice period) means a new reminder.
        static::saving(function (Contract $contract): void {
            if ($contract->isDirty(['end_date', 'notice_days'])) {
                $contract->reminded_at = null;
            }
        });
    }

    /**
     * Active and inside its notice window (or past its end).
     *
     * @param  Builder<Contract>  $query
     */
    public function scopeDueForRenewal(Builder $query): void
    {
        $query->where('status', ContractStatus::Active)
            ->whereRaw('DATE_SUB(end_date, INTERVAL notice_days DAY) <= ?', [today()->toDateString()]);
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
     * @return BelongsTo<Quote, $this>
     */
    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    /**
     * @return BelongsTo<Deal, $this>
     */
    public function renewalDeal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'renewal_deal_id');
    }
}
