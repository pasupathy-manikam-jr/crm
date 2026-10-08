<?php

namespace App\Models;

use App\Models\Concerns\CrmRecord;
use App\Models\Concerns\Owned;
use Database\Factories\AccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A company the business sells to.
 *
 * @property int $id
 * @property string $name
 * @property string|null $industry
 * @property string|null $website
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $billing_address
 * @property string|null $shipping_address
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'industry', 'website', 'phone', 'email', 'billing_address', 'shipping_address', 'owner_id'])]
class Account extends Model
{
    /** @use HasFactory<AccountFactory> */
    use CrmRecord, HasFactory, Owned, SoftDeletes;

    /**
     * @return HasMany<Contact, $this>
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    /**
     * @return HasMany<Deal, $this>
     */
    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
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
