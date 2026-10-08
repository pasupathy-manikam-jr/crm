<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ConvertLeadController;
use App\Http\Controllers\CsvController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\DuplicateController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\FieldDefinitionController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\MailboxController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\QuoteApprovalController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SavedViewController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SupportCaseController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebFormController;
use App\Http\Controllers\WebFormSubmissionController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\WorkflowRuleController;
use App\Support\CsvSchema;
use App\Support\Duplicates;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Public: website lead forms post here (no login, no CSRF token; see WebFormSubmissionController).
Route::post('f/{token}', WebFormSubmissionController::class)->middleware('throttle:10,1')->name('web-forms.submit');

// Language switch, for guests (sign-in page) and signed-in users alike.
Route::post('locale', LocaleController::class)->middleware('throttle:20,1')->name('locale.update');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('search', SearchController::class)->name('search');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('duplicates/{type}', [DuplicateController::class, 'index'])->whereIn('type', Duplicates::TYPES)->name('duplicates.index');
    Route::post('duplicates/{type}/merge', [DuplicateController::class, 'merge'])->whereIn('type', Duplicates::TYPES)->name('duplicates.merge');
    Route::post('saved-views', [SavedViewController::class, 'store'])->name('saved-views.store');
    Route::delete('saved-views/{view}', [SavedViewController::class, 'destroy'])->whereNumber('view')->name('saved-views.destroy');
    Route::get('export/{type}', [CsvController::class, 'export'])->whereIn('type', CsvSchema::TYPES)->name('csv.export');
    Route::post('import/{type}', [CsvController::class, 'import'])->whereIn('type', CsvSchema::TYPES)->name('csv.import');

    Route::resource('accounts', AccountController::class)->except(['create', 'edit']);
    Route::resource('contacts', ContactController::class)->except(['create', 'edit']);
    Route::resource('leads', LeadController::class)->except(['create', 'edit']);
    Route::post('leads/{lead}/convert', ConvertLeadController::class)->name('leads.convert');
    Route::resource('deals', DealController::class)->except(['create', 'edit']);
    Route::resource('quotes', QuoteController::class);
    Route::patch('quotes/{quote}/status', [QuoteController::class, 'updateStatus'])->name('quotes.status');
    Route::post('quotes/{quote}/approval', QuoteApprovalController::class)->name('quotes.approval');
    Route::middleware('can:manage-catalog')->group(function () {
        Route::get('inbox', [InboxController::class, 'index'])->name('inbox.index');
        Route::post('inbox/{email}/lead', [InboxController::class, 'createLead'])->name('inbox.lead');
        Route::post('inbox/{email}/retry', [InboxController::class, 'retry'])->name('inbox.retry');
    });
    Route::resource('web-forms', WebFormController::class)->only(['index', 'store', 'update', 'destroy'])->middleware('can:manage-catalog');
    Route::resource('products', ProductController::class)->only(['index', 'store', 'update', 'destroy'])->middleware('can:manage-catalog');
    Route::patch('deals/{deal}/stage', [DealController::class, 'moveStage'])->name('deals.stage');
    Route::resource('cases', SupportCaseController::class)->except(['create', 'edit'])->parameters(['cases' => 'case']);
    Route::patch('cases/{case}/status', [SupportCaseController::class, 'updateStatus'])->name('cases.status');
    Route::resource('contracts', ContractController::class)->except(['create', 'edit']);
    Route::post('contracts/{contract}/renew', [ContractController::class, 'renew'])->name('contracts.renew');
    Route::get('activities/calendar', [ActivityController::class, 'calendar'])->name('activities.calendar');
    Route::patch('activities/{activity}/reschedule', [ActivityController::class, 'reschedule'])->name('activities.reschedule');
    Route::resource('activities', ActivityController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::patch('activities/{activity}/done', [ActivityController::class, 'toggleDone'])->name('activities.done');
    Route::post('emails', [EmailController::class, 'store'])->middleware('throttle:30,1')->name('emails.store');
    Route::resource('notes', NoteController::class)->only(['store', 'destroy']);
    Route::resource('attachments', AttachmentController::class)->only(['store', 'show', 'destroy']);

    Route::middleware('can:manage-users')->group(function () {
        Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('teams', TeamController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('workflows', WorkflowRuleController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('holidays', HolidayController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('mailboxes', MailboxController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('mailboxes/{mailbox}/test', [MailboxController::class, 'test'])->middleware('throttle:10,1')->name('mailboxes.test');
        Route::post('mailboxes/{mailbox}/sync', [MailboxController::class, 'sync'])->middleware('throttle:10,1')->name('mailboxes.sync');
        Route::resource('webhooks', WebhookController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('webhooks/{webhook}/test', [WebhookController::class, 'test'])->name('webhooks.test');
        Route::resource('custom-fields', FieldDefinitionController::class)->only(['index', 'store', 'update', 'destroy'])->parameters(['custom-fields' => 'field'])->names('fields');
    });
});

require __DIR__.'/settings.php';
