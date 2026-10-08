<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property int|null $team_id
 * @property string|null $locale
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'team_id', 'locale'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements HasLocalePreference
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * @return HasMany<SavedView, $this>
     */
    public function savedViews(): HasMany
    {
        return $this->hasMany(SavedView::class);
    }

    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * The user's CRM role; each user holds exactly one.
     */
    public function role(): ?UserRole
    {
        $name = $this->getRoleNames()->first();

        return $name === null ? null : UserRole::tryFrom($name);
    }

    /**
     * Whether any account, contact, lead, deal or activity (deleted ones included) still names this user as owner.
     */
    public function ownsRecords(): bool
    {
        foreach ([Account::class, Contact::class, Lead::class, Deal::class, Activity::class, Quote::class] as $model) {
            if ($model::withoutGlobalScope('visible')->withTrashed()->where('owner_id', $this->id)->exists()) {
                return true;
            }
        }

        return false;
    }

    /**
     * The users this user may give a record to: the same set whose records they can see.
     *
     * @return Collection<int, User>
     */
    public function assignableOwners(): Collection
    {
        $ids = $this->visibleOwnerIds();

        return User::query()->when($ids !== null, fn ($query) => $query->whereKey($ids))->orderBy('name')->get(['id', 'name']);
    }

    /**
     * Ids of the users whose records this user may see, or null for everyone's.
     * A manager without a team, or a user without a role, sees only their own.
     *
     * @return list<int>|null
     */
    public function visibleOwnerIds(): ?array
    {
        return match ($this->role()?->visibility()) {
            'all' => null,
            'team' => $this->team_id === null
                ? [$this->id]
                : array_values(User::where('team_id', $this->team_id)->pluck('id')->map(fn ($id): int => (int) $id)->all()),
            default => [$this->id],
        };
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Emails and notifications go out in the recipient's language.
     */
    public function preferredLocale(): ?string
    {
        return $this->locale;
    }
}
