# OricCRM Plan (vtiger / SugarCRM-style)

Stack (same as lms-mentor): Laravel 13 + Inertia 3 + React 19 + TypeScript + Tailwind 4, Fortify, spatie/laravel-permission.

Scope: single company (one organisation, one database). No multi-tenancy and no `tenant_id`.

## UI conventions

- **shadcn/ui only** (`resources/js/components/ui`), added through the shadcn CLI. The current CLI (4.21) writes `import { cn } from "cn"` and installs an unrelated `cn` npm package: after every `add`, change the import to `@/lib/utils` and run `npm uninstall cn`. It also picks pnpm because of `pnpm-workspace.yaml`; move that file aside while adding.
- **Every list has List/Grid views** (`useViewMode` + `ViewToggle`, remembered per browser).
- **Lists use `DataTable`** (`resources/js/components/data-table.tsx`): the header stays visible while rows scroll, and the action column is pinned to the right. Each row's actions are in a `DropdownMenu`.
- **Modals:** `Dialog` for forms, `AlertDialog` to confirm destructive actions.
- **Dropdowns:** `DropdownMenu` for actions, `Select` for choosing a value.
- **No HTML5 validation:** every `<Form>` has `noValidate`. Validation lives only in Laravel Form Requests, and errors are shown inline with `InputError`.

## Key design decision

vtiger and Sugar are metadata-driven: modules, fields and layouts are stored as database rows, and every screen is generated from them. That design is where most of their complexity and bugs come from.

**Approach:** build the core modules as real Eloquent models and tables. Each table gets a `custom_fields` JSON column, with field definitions in a small `field_definitions` table. Admins get custom fields without a generic module builder. A full "create your own module" builder is out of scope until a customer needs modules we didn't ship.

## Data model (core)

| Entity                              | Key fields / relations                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `users`, `roles`, `teams`           | spatie/permission; `team_id` on users                                              |
| `accounts` (companies)              | name, industry, website, phone, billing/shipping address, owner_id, parent_id      |
| `contacts`                          | first/last, email, phone, account_id, owner_id                                     |
| `leads`                             | person and company fields, source, status; converts into account, contact and deal |
| `deals` (opportunities)             | account_id, contact_id, amount, currency, stage, probability, close_date, owner_id |
| `pipelines`, `stages`               | ordered stages, each with a default probability                                    |
| `activities`                        | polymorphic: type (call/meeting/task), subject, due_at, done_at, assigned_to       |
| `notes`, `attachments`              | polymorphic; attachments use Laravel's storage                                     |
| `products`, `quotes`, `quote_items` | prices and tax; quotes exported as PDFs                                            |
| `cases` (tickets)                   | account/contact, priority, status, SLA due                                         |
| `audit_log`                         | polymorphic; records field changes as old→new JSON                                 |
| `field_definitions`                 | entity, key, label, type (text/number/date/select), options, required              |

Every record carries `owner_id` plus timestamps and soft deletes.

## Access control

- Roles and permissions per module and action (view/create/edit/delete/export), using spatie.
- Record visibility per role: **own / team / all**, enforced by one global scope on an `Owned` trait. Because it is a single shared scope, no list, search, export or report can skip it.
- Policies on every controller action.

## Phases

### Phase 1: MVP (about 3–4 weeks)

1. Scaffold the Laravel React starter kit; copy CI (`tests.yml`, `deploy-assets.yml`) and `scripts/deploy.sh` from lms-mentor.
2. ~~Auth, users, roles, teams and the visibility scope.~~ Done: roles Admin (all) / Sales manager (team) / Sales rep (own) in `App\Enums\UserRole`; `User::visibleOwnerIds()`; Users and Teams admin pages. The `Owned` global scope gets attached with Accounts in step 3.
3. ~~CRUD for accounts, contacts and leads, sharing one list component (server-side pagination, sorting, filters, column picker) and one detail layout.~~ Done: `Owned` trait (404 outside visibility), `ListsRecords` controller concern, `ListToolbar` + `DataTable` sorting/column picker, `RecordFormDialog`. Detail pages show details + related contacts; the activities, notes and history tabs arrive with steps 6–7.
4. ~~Lead conversion into account, contact and deal in a single transaction.~~ Done: `App\Actions\Crm\ConvertLead` (row lock, one transaction), lead status `converted` set only by conversion.
5. ~~Deals with a pipeline Kanban (drag to change stage).~~ Done: one pipeline of DB `stages` (probability + open/won/lost), board + list views, stage stepper on the deal page. Multiple pipelines left out until needed.
6. ~~Activities, a "My tasks" view and due-today notifications.~~ Done: polymorphic `activities` (morph map account/contact/lead/deal, assignee = owner_id), My tasks tabs, Activities panel on record pages, top-bar badge for due today/overdue. Email digest left until mail is configured. Timezone defaults to Asia/Kuala_Lumpur (APP_TIMEZONE).
7. ~~Notes, attachments and the audit log.~~ Done: `CrmRecord` trait (activities/notes/attachments/history relations + automatic audit on create/update/delete), private-disk files served only through `AttachmentController` after a visibility check, `RecordTabs` (Overview, Activities, Notes, Files, History) on every record page.
8. ~~Global search with `LIKE` across names, emails and phones.~~ Done: `GET /search` (top 5 per type, phone matched on digits via REGEXP_REPLACE, visibility scopes apply) feeding live results in the ⌘K palette.
9. ~~CSV import and export.~~ Done: `CsvController` + `CsvSchema`; import runs in the request (≤5,000 rows, bad rows skipped and listed, header-based column guessing); export streams the filtered list.
10. ~~Dashboard.~~ Done: open/weighted pipeline, won this month + win rate, new leads, pipeline by stage, my due tasks, deals closing in 30 days — all scoped by visibility.

### Phase 2: Sales ops (COMPLETE)

- ~~Products, quotes and quote PDFs.~~ Done: products catalogue (admins + sales managers), quotes Q-<year>-#### with line items, cent-exact totals, Draft→Sent→Accepted/Declined, create from a deal; PDF via the print-ready quote page (browser Save as PDF) instead of dompdf — add dompdf only if quotes must be emailed as attachments. Converting a quote to an invoice depends on the E-invoice project.
- ~~Custom fields~~ Done: `field_definitions` (text, long text, number, date, yes/no, dropdown; required; deactivate-not-delete), values in `custom_fields` JSON merged on write so deactivated values survive, rules generated per field, shown in forms / record pages / list columns / CSV, history per field. Not yet: filtering and sorting lists by a custom field (add when needed, with a generated column + index for heavy use).
- ~~Saved list views/filters per user.~~ Done: `saved_views` (private per user), Views menu on every list toolbar (apply / save current / delete).
- ~~Duplicate detection and merge~~ Done: `App\Support\Duplicates` (email, phone last 9 digits, normalised name ignoring Sdn Bhd/Ltd/…), Find duplicates page per type, field-by-field merge in `App\Actions\Crm\MergeRecords` (moves activities/notes/files/contacts/deals/quotes/conversion links, fills custom-field gaps, soft-deletes the rest, logs `merged`), warning toast on create. Converted leads can't be merged.
- ~~Web-to-lead form~~ Done: `web_forms` (admins + managers), public `POST /f/{token}` (no CSRF, honeypot `website_url`, 10/min per IP), lead owned by the form's owner with source Website and the message as a note, embed-code dialog, optional thank-you redirect. Round-robin assignment left for workflows.
- ~~Email: send from a record over SMTP and log it as an activity.~~ Done: Send email on lead/contact/account/deal pages (`RecordEmail` mailable from the app address with the user's name, reply-to the user), logged as a done Email activity. Staging needs real SMTP settings in .env (MAIL_*). Inbox reading comes in Phase 3.
- ~~Basic reports builder.~~ Done: Reports page over leads/deals/quotes/accounts/contacts/activities, group by owner/stage/status/source/industry/account/type/month, count or money totals, created-date range, bar table + CSV; whitelisted SQL fragments in `App\Support\ReportDefinitions`. Saved reports: use the browser URL for now.

### Phase 3: Service and automation (COMPLETE — mail features built, off until credentials)

- ✅ Cases/tickets with SLA due dates, plus a scheduled command that escalates breaches. (Done: SupportCase model — "case" is reserved in PHP; SLA from priority, urgent 4h / high 24h / normal 72h / low 120h, calendar hours; `cases:escalate` every 15 min emails owner + team managers once; nav badge counts cases past SLA.)
- ✅ Workflow rules shaped as "when [module] is [created/updated] and [conditions], then [set field / create task / send email]". Rules are stored as JSON and run by a queued listener. (Done: Admin → Workflows; modules lead/contact/account/deal/case/quote, events created/updated/either, AND-ed conditions incl. "changed", actions set field / create task / send email / require approval; `App\Support\Workflows` runs rules after the save commits — in-request, not queued yet — and actions never re-trigger rules.)
- ✅ Webhooks and a REST API (Sanctum tokens) for integrations. (Done: /api/v1/{leads,contacts,accounts,deals,cases,contracts} CRUD via one RecordController reusing the app form requests, PATCH merges, search/updated_since/owner_id/status filters, 120 req/min; tokens per user in Settings → API tokens, read or read+write abilities; Admin → Webhooks: per-event subscriptions, HMAC-SHA256 X-OricCRM-Signature, queued with 3 tries, private/local URLs refused unless WEBHOOKS_ALLOW_PRIVATE, Send test. Schedule drains the queue every minute — staging needs the `schedule:run` cron.)
- ✅ Calendar view of activities. (Done: /activities/calendar month grid, Monday first, owner filter, click to edit, + per day, drag to reschedule keeping the time; List | Calendar switch on My tasks.)
- ✅ **Quote approvals:** a rule such as "discount > X% or total > Y needs manager approval". The quote is locked in "Pending approval" until approved, and the approver is notified. Approve/reject is logged with a reason. Built as an action in the workflow engine.
- ✅ **Contracts:** account, start/end dates, value, renewal terms, linked quote. A scheduled reminder fires N days before the end date, and a contract can be renewed into a new deal. (Done: Contracts list/page with status draft/active/expired/cancelled/renewed; `contracts:remind` daily 07:10 creates a "Renew …" task + emails the owner once when inside the notice window, re-armed if the end date or notice changes, and expires ended active contracts; "Renew as deal" opens a deal in the first open stage and links it. Account/contact merge now also moves cases and contracts.)
- ✅ **Email-to-case:** reuses the inbox sync. Emails to a support mailbox create cases, and replies (matched by thread) go onto the existing case.
- ✅ **Email inbox → draft quotes** (needs products and quotes from Phase 2):
    - **Connect mailboxes over IMAP**, which works with Gmail and any other provider. Gmail and Google Workspace sign in with OAuth (XOAUTH2); other providers use an app password. Credentials are stored with Laravel's `encrypted` cast. Library: `webklex/laravel-imap`.
    - **Sync:** a scheduled job every few minutes fetches new messages since the last seen UID for each mailbox. Each message is stored as an `emails` row (message-id kept unique so nothing is imported twice), and its attachments are saved.
    - **Matching:** the sender's address is matched to a contact, then the contact's account. The email is logged on that record's activity timeline. Senders that don't match go to an "Unmatched" list, where one click turns them into a lead.
    - **Extraction:** a queued job sends each matched email to the Claude API and gets back structured output: whether it is a quote request (with a confidence score), customer, line items (product, quantity, unit), requested date and notes. Line items are matched to `products` by name/SKU. Items with no match are flagged rather than guessed.
    - **Review queue:** every result becomes a **draft** quote, with the source email shown beside it. A person edits it, then approves and sends it. Nothing is ever sent or invoiced automatically.
    - **Invoices** follow the normal quote → approved → invoice flow through the E-invoice project, never straight from an email.
    - **Controls:** an on/off switch for each mailbox, allow/deny lists of sender domains, an AI usage log (tokens and cost per email), and failed jobs that retry and then show up in an admin list.
    - **Non-goals:** sending replies from the CRM inbox UI, two-way sync of labels and read state, and calendar sync.

### Mail (done 2026-10-08, waiting for credentials)

- Admin → Mailboxes: IMAP via webklex/php-imap (pure PHP), app-password login (Gmail: imap.gmail.com:993 SSL + app password); XOAUTH2 not built yet. Off by default; Test connection / Read now; allow/block domain lists; owner for new cases/leads. `mail:sync` every 5 min, 50 messages a run, first run only the last day, messages left unread, Message-ID dedupe.
- Email-to-case: new email opens a case (contact/account matched by sender, attachments saved to the case); replies join by In-Reply-To/References or a C-YYYY-NNNN in the subject, as a note, reopening resolved cases. Without cases, emails are logged on the contact/lead timeline.
- Draft quotes: matched emails go to Claude (services.anthropic: ANTHROPIC_API_KEY, ANTHROPIC_MODEL default claude-sonnet-5-5, cost per MTok env) through a forced tool call; confidence ≥ 0.5 makes a draft quote, lines matched by SKU then exact name, unmatched lines at 0 and listed in the notes; the source email shows on the quote page. Nothing is sent automatically. No key → "skipped".
- Admin → Inbox (admins + managers): Unknown senders (Create lead), Quote drafts, Cases, AI failed (Retry AI), monthly token/cost total. IMAP itself is untested against a real server — first real mailbox needs a live check.

### Gaps closed after Phase 3 items (2026-10-08)

- ⌘K search finds cases (number/subject) and contracts.
- Account and contact pages list their cases and contracts; "Open case" / "Add contract" open the add form prefilled (?new=1&account=&contact=).
- Lists filter by dropdown and yes/no custom fields (cf_<key>) and sort by any custom field (numbers numerically); CSV export follows the filters.
- Case SLAs count working time: CRM_WORK_DAYS / CRM_WORK_START / CRM_WORK_END in .env (Mon–Fri 9–18 default), holidays in Admin → Holidays; urgent 4 working hours, high/normal/low 1/3/5 working days. CRM_SLA_BUSINESS_HOURS=false counts every hour. Existing deadlines don't move when holidays change.

### Later, only on request

- **Sales:** forecasting with quotas, price books and bundles, sales orders, purchase orders, vendors and inventory, recurring invoices (in the E-invoice project), round-robin assignment rules, lead scoring.
- **Marketing:** campaigns with ROI, and mass email through Mailchimp/Brevo integration (never self-hosted bulk sending).
- **Support:** customer portal, knowledge base, SLA timers with business hours and holidays.
- **Platform:** module builder (not planned), layout editor, full BPM process designer, field-level permissions, sharing rules, multi-currency with exchange rates, Google Calendar two-way sync, telephony (Twilio/Asterisk), a mobile app (do a responsive web app first), GDPR export/erase and consent, full two-way mail sync, territory management.

## Cross-cutting

- **Tests:** feature tests for the visibility scope, permissions, lead conversion, import, and email → draft quote (with a faked Claude API response). These are the paths where a bug leaks or loses data.
- **CI:** the same `composer ci:check` as lms-mentor (pint, tsc, larastan, phpunit).
- **Deploy:** `~/crm` on the staging box, symlinked to `ui.staging.oriclabdev.com/crm`; DB `stagingoriclabde_crm`; frontend built in GitHub Actions with `APP_PATH_PREFIX=crm`.
- **Performance:** index `owner_id`, foreign keys, `stage`, `status` and the email columns. Add MySQL FULLTEXT once `LIKE` search gets slow.

## Open questions

1. Which modules matter most for the first demo: sales (leads/deals) or support (cases)?
