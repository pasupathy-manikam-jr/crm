<?php

namespace App\Providers;

use App\Enums\UserRole;
use App\Models\InboundEmail;
use App\Models\User;
use App\Models\Webhook;
use App\Support\CrmRecords;
use App\Support\Locales;
use App\Support\Workflows;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // Short, stable names in the *_type columns (activities, notes, files, history).
        Relation::morphMap(CrmRecords::TYPES);

        // Explicit bindings so a record's route parameter ({lead}, {case}, …) is the model
        // everywhere, including the generic API controller; visibility scopes make others 404.
        foreach (CrmRecords::TYPES as $alias => $model) {
            Route::model($alias, $model);
        }

        Route::model('email', InboundEmail::class);

        // A language picked on the sign-in page (locale cookie) carries over to the account.
        Event::listen(Login::class, function (Login $event): void {
            $locale = request()->cookie('locale');

            if ($event->user instanceof User && is_string($locale) && isset(Locales::SUPPORTED[$locale]) && $event->user->locale !== $locale) {
                $event->user->forceFill(['locale' => $locale])->save();
            }
        });

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));

        foreach (CrmRecords::TYPES as $model) {
            $model::created(fn (Model $record) => Webhook::dispatchFor($record, 'created'));
            $model::updated(fn (Model $record) => Webhook::dispatchFor($record, 'updated'));
            $model::deleted(fn (Model $record) => Webhook::dispatchFor($record, 'deleted'));
        }

        foreach (Workflows::models() as $model) {
            $model::created(fn (Model $record) => Workflows::queue($record, 'created'));
            $model::updated(fn (Model $record) => Workflows::queue($record, 'updated'));
        }

        Gate::define('manage-users', fn (User $user): bool => $user->hasRole(UserRole::Admin));
        Gate::define('manage-catalog', fn (User $user): bool => $user->hasAnyRole([UserRole::Admin->value, UserRole::SalesManager->value]));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
