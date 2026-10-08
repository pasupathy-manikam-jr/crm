<?php

namespace App\Models;

use App\Enums\CasePriority;
use App\Enums\CaseStatus;
use App\Models\Concerns\CrmRecord;
use App\Models\Concerns\Owned;
use App\Support\BusinessHours;
use Carbon\CarbonInterface;
use Database\Factories\SupportCaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A customer support case (ticket), numbered C-<year>-<sequence>. Its priority sets the
 * SLA: the time by which it must be resolved, in working time from when it was opened.
 * ("Case" is a reserved word in PHP, hence SupportCase.)
 *
 * @property int $id
 * @property string $number
 * @property string $subject
 * @property string|null $description
 * @property int|null $account_id
 * @property int|null $contact_id
 * @property CasePriority $priority
 * @property CaseStatus $status
 * @property CarbonInterface $sla_due_at
 * @property CarbonInterface|null $resolved_at
 * @property CarbonInterface|null $escalated_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 */
#[Fillable(['subject', 'description', 'account_id', 'contact_id', 'priority', 'status', 'owner_id'])]
class SupportCase extends Model
{
    /** @use HasFactory<SupportCaseFactory> */
    use CrmRecord, HasFactory, Owned, SoftDeletes;

    /**
     * @var array<string, string>
     */
    protected $attributes = ['status' => 'open', 'priority' => 'normal'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'priority' => CasePriority::class,
            'status' => CaseStatus::class,
            'sla_due_at' => 'datetime',
            'resolved_at' => 'datetime',
            'escalated_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SupportCase $case): void {
            $case->number ??= self::nextNumber();
        });

        static::saving(function (SupportCase $case): void {
            // The SLA runs from opening; a new priority moves the deadline, and a deadline
            // back in the future may be escalated again if it is missed.
            if (! $case->exists || $case->isDirty('priority')) {
                $case->sla_due_at = BusinessHours::add($case->created_at ?? now(), ...$case->priority->slaTarget());

                if ($case->sla_due_at->isFuture()) {
                    $case->escalated_at = null;
                }
            }

            if ($case->isDirty('status')) {
                $case->resolved_at = $case->status->isDone() ? ($case->resolved_at ?? now()) : null;
            }
        });
    }

    /**
     * C-2026-0001, C-2026-0002, … restarting each year (same scheme as quotes).
     */
    public static function nextNumber(): string
    {
        $prefix = 'C-'.now()->year.'-';
        $last = self::withoutGlobalScopes()->withTrashed()->where('number', 'like', $prefix.'%')
            ->lockForUpdate()->orderByDesc('number')->value('number');

        return $prefix.str_pad((string) ((int) substr((string) $last, strlen($prefix)) + 1), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Still open and past its SLA deadline.
     *
     * @param  Builder<SupportCase>  $query
     */
    public function scopeBreached(Builder $query): void
    {
        $query->whereNull('resolved_at')->where('sla_due_at', '<', now());
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
}
