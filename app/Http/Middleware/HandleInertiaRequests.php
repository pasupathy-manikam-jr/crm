<?php

namespace App\Http\Middleware;

use App\Models\Activity;
use App\Models\FieldDefinition;
use App\Models\SupportCase;
use App\Support\Locales;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => App::getLocale(),
            'locales' => Locales::SUPPORTED,
            // Sent once per language (and file version) and remembered by the browser.
            'translations' => Inertia::once(fn (): array => Locales::translations(App::getLocale()))->as('translations-'.Locales::version(App::getLocale())),
            'currency' => config('app.currency'),
            // The user's saved list filters, for the Views menu on list pages.
            'savedViews' => fn () => $request->user()?->savedViews()->orderBy('name')->get(['id', 'list', 'name', 'query']) ?? [],
            // Active custom fields by record type, for forms, record pages and list columns.
            'customFields' => fn () => $request->user() === null ? [] : FieldDefinition::where('active', true)
                ->orderBy('position')->orderBy('id')->get(['entity', 'key', 'label', 'type', 'options', 'required'])->groupBy('entity'),
            'auth' => [
                'user' => $request->user(),
                'can' => [
                    'manageUsers' => (bool) $request->user()?->can('manage-users'),
                    'manageCatalog' => (bool) $request->user()?->can('manage-catalog'),
                ],
                // Open activities assigned to me that are due today or overdue: the top-bar badge.
                'dueActivities' => fn (): int => $request->user() === null
                    ? 0
                    : Activity::needsAttention()->where('owner_id', $request->user()->id)->count(),
                // Open cases past their SLA among those the user can see.
                'breachedCases' => fn (): int => $request->user() === null ? 0 : SupportCase::breached()->count(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
