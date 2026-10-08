<?php

namespace App\Models;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Models\Concerns\CrmRecord;
use App\Models\Concerns\Owned;
use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A prospect not yet qualified; converts into an account, contact and deal (Phase 1 step 4).
 *
 * @property int $id
 * @property string $first_name
 * @property string $last_name
 * @property-read string $full_name
 * @property string|null $company
 * @property string|null $job_title
 * @property string|null $email
 * @property string|null $phone
 * @property LeadSource|null $source
 * @property LeadStatus $status
 * @property Carbon|null $converted_at
 * @property int|null $converted_account_id
 * @property int|null $converted_contact_id
 * @property int|null $converted_deal_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['first_name', 'last_name', 'company', 'job_title', 'email', 'phone', 'source', 'status', 'owner_id'])]
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use CrmRecord, HasFactory, Owned, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $appends = ['full_name'];

    /**
     * @var array<string, string>
     */
    protected $attributes = ['status' => 'new'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'source' => LeadSource::class,
            'status' => LeadStatus::class,
            'converted_at' => 'datetime',
        ];
    }

    public function isConverted(): bool
    {
        return $this->converted_at !== null;
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function convertedAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'converted_account_id');
    }

    /**
     * @return BelongsTo<Contact, $this>
     */
    public function convertedContact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'converted_contact_id');
    }

    /**
     * @return BelongsTo<Deal, $this>
     */
    public function convertedDeal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'converted_deal_id');
    }

    /**
     * @return Attribute<string, never>
     */
    protected function fullName(): Attribute
    {
        return Attribute::get(fn (): string => trim("{$this->first_name} {$this->last_name}"));
    }
}
