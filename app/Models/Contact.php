<?php

namespace App\Models;

use App\Models\Concerns\CrmRecord;
use App\Models\Concerns\Owned;
use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A person, usually at an account.
 *
 * @property int $id
 * @property string $first_name
 * @property string $last_name
 * @property-read string $full_name
 * @property string|null $job_title
 * @property string|null $email
 * @property string|null $phone
 * @property int|null $account_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['first_name', 'last_name', 'job_title', 'email', 'phone', 'account_id', 'owner_id'])]
class Contact extends Model
{
    /** @use HasFactory<ContactFactory> */
    use CrmRecord, HasFactory, Owned, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $appends = ['full_name'];

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * @return Attribute<string, never>
     */
    protected function fullName(): Attribute
    {
        return Attribute::get(fn (): string => trim("{$this->first_name} {$this->last_name}"));
    }

    /**
     * @return HasMany<SupportCase, $this>
     */
    public function supportCases(): HasMany
    {
        return $this->hasMany(SupportCase::class);
    }

    /**
     * @return HasMany<Contract, $this>
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
