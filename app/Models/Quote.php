<?php

namespace App\Models;

use App\Enums\QuoteStatus;
use App\Enums\UserRole;
use App\Models\Concerns\Owned;
use Carbon\CarbonInterface;
use Database\Factories\QuoteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A priced offer to an account, numbered Q-<year>-<sequence>.
 *
 * @property int $id
 * @property string $number
 * @property int|null $account_id
 * @property int|null $contact_id
 * @property int|null $deal_id
 * @property QuoteStatus $status
 * @property CarbonInterface|null $valid_until
 * @property string|null $notes
 * @property string $subtotal
 * @property string $discount_total
 * @property string $tax_total
 * @property string $total
 * @property string|null $approval_decision
 * @property string|null $approval_note
 * @property int|null $approval_by
 * @property CarbonInterface|null $approval_at
 * @property-read float $discount_percent
 * @property CarbonInterface|null $created_at
 */
#[Fillable(['account_id', 'contact_id', 'deal_id', 'status', 'valid_until', 'notes', 'owner_id'])]
class Quote extends Model
{
    /** @use HasFactory<QuoteFactory> */
    use HasFactory, Owned, SoftDeletes;

    /**
     * @var array<string, string>
     */
    protected $attributes = ['status' => 'draft'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => QuoteStatus::class,
            'valid_until' => 'date:Y-m-d',
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
            'approval_at' => 'datetime',
        ];
    }

    /**
     * Discount as a share of the subtotal, for rules such as "discount over 15%".
     *
     * @return Attribute<float, never>
     */
    protected function discountPercent(): Attribute
    {
        return Attribute::get(fn (): float => (float) $this->subtotal > 0 ? round((float) $this->discount_total / (float) $this->subtotal * 100, 2) : 0.0);
    }

    public function isLocked(): bool
    {
        return $this->status === QuoteStatus::PendingApproval;
    }

    /**
     * Who may approve it: admins, and sales managers of the owner's team; never the owner.
     *
     * @return Builder<User>
     */
    public function approvers(): Builder
    {
        $teamId = User::whereKey($this->owner_id)->value('team_id');

        return User::query()->whereKeyNot($this->owner_id)->where(fn (Builder $q) => $q
            ->whereHas('roles', fn (Builder $r) => $r->where('name', UserRole::Admin->value))
            ->when($teamId !== null, fn (Builder $q) => $q->orWhere(fn (Builder $q) => $q
                ->where('team_id', $teamId)
                ->whereHas('roles', fn (Builder $r) => $r->where('name', UserRole::SalesManager->value)))));
    }

    public function canBeApprovedBy(User $user): bool
    {
        return $this->approvers()->whereKey($user->id)->exists();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approval_by');
    }

    protected static function booted(): void
    {
        static::creating(function (Quote $quote): void {
            if (! isset($quote->number)) {
                $quote->number = self::nextNumber();
            }
        });
    }

    /**
     * Q-2026-0001, Q-2026-0002, … restarting each year. Called inside the save's
     * transaction; the unique index on number rejects a rare concurrent duplicate.
     */
    public static function nextNumber(): string
    {
        $prefix = 'Q-'.now()->year.'-';
        $last = self::withoutGlobalScopes()->withTrashed()->where('number', 'like', $prefix.'%')
            ->lockForUpdate()->orderByDesc('number')->value('number');

        return $prefix.str_pad((string) ((int) substr((string) $last, strlen($prefix)) + 1), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Replace the lines and recompute every total, in cents to avoid float drift.
     *
     * @param  list<array{product_id?: int|null, description: string, quantity: string|float, unit_price: string|float, discount_percent?: string|float|null, tax_rate?: string|float|null}>  $lines
     */
    public function syncItems(array $lines): void
    {
        $this->items()->delete();
        $gross = $discount = $tax = 0;

        foreach ($lines as $i => $line) {
            $lineGross = (int) round((float) $line['quantity'] * (float) $line['unit_price'] * 100);
            $lineDiscount = (int) round($lineGross * (float) ($line['discount_percent'] ?? 0) / 100);
            $lineTax = (int) round(($lineGross - $lineDiscount) * (float) ($line['tax_rate'] ?? 0) / 100);

            $this->items()->create([
                'product_id' => $line['product_id'] ?? null,
                'position' => $i + 1,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'discount_percent' => $line['discount_percent'] ?? 0,
                'tax_rate' => $line['tax_rate'] ?? 0,
                'line_total' => ($lineGross - $lineDiscount) / 100,
            ]);

            $gross += $lineGross;
            $discount += $lineDiscount;
            $tax += $lineTax;
        }

        $this->forceFill([
            'subtotal' => $gross / 100,
            'discount_total' => $discount / 100,
            'tax_total' => $tax / 100,
            'total' => ($gross - $discount + $tax) / 100,
        ])->save();
    }

    /**
     * @return HasMany<QuoteItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class)->orderBy('position');
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
     * @return BelongsTo<Deal, $this>
     */
    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }
}
