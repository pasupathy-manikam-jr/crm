# OricCRM — Customer Relationship Management

A CRM for one company, in the spirit of vtiger and SugarCRM: leads, accounts, contacts, deals, quotes, support cases and
contracts, with workflows, a calendar, reports, a REST API and email-to-case — in one web app.

**Live demo:** <https://ui.staging.oriclabdev.com/crm>

| Role          | Email               | Password   |
| ------------- | ------------------- | ---------- |
| Admin         | admin@example.com   | `Zx123456` |
| Sales manager | manager@example.com | `Zx123456` |
| Sales rep     | rep@example.com     | `Zx123456` |

Built with Laravel 13, Inertia 3, React 19, Tailwind CSS 4 and shadcn/ui.

---

## Features

### Made for Malaysia

- Amounts in Ringgit (RM), Asia/Kuala_Lumpur time zone, weeks starting Monday.
- Three interface languages: **English, Bahasa Melayu and 中文**, chosen per user (or on the sign-in page); emails go out
  in each recipient's language.

### Sales

- **Leads** with status and source, and one-click **Convert** into an account, contact and deal.
- **Accounts** and **contacts**, with each account's contacts, deals, cases and contracts on its page.
- **Deals** on a drag-and-drop pipeline board (or a list), stage probabilities and a weighted pipeline.
- **Quotes** from the product catalogue with discounts and tax worked out to the cent, Draft → Sent → Accepted / Declined,
  and a print-ready page to save as PDF.
- **Quote approvals**: a workflow rule (e.g. discount over 15%) holds a quote until a manager approves or rejects it with a reason.
- Duplicate detection on create, and a **Find duplicates** page that merges records field by field.
- Website lead forms: embed a form on your site and each submission becomes a lead.

### Service

- **Cases** with SLA deadlines from their priority, counted in working hours and skipping holidays; overdue cases are
  escalated to the owner and their team's managers.
- **Contracts** with a renewal reminder before they end, and **Renew as deal** for the next term.
- **Mailboxes** over IMAP (Gmail app password or any provider): emails open cases, replies join the same case, and
  quote requests become draft quotes drafted by Claude for a person to review. Off until a mailbox and API key are set.

### Everyday work

- Activities (calls, meetings, tasks, emails) on every record, a **My tasks** list and a month **Calendar** with drag to reschedule.
- Notes, files and a full change history on every record; send email from a record and it's logged there.
- Lists with search, filters (including custom fields), sorting, saved views, list or grid view and CSV import / export.
- ⌘K search across every record type.
- Dashboard (pipeline, wins, due tasks, deals closing soon) and a reports builder with CSV export.

### Administration

- Users with roles: sales reps see their own records, sales managers their team's, admins everything.
- Teams, custom fields on any record type, products, holidays.
- **Workflows**: when a record is created or updated and conditions match, set a field, create a task, send an email or
  require quote approval.
- **REST API** (`/api/v1`, personal access tokens with read or read & write access) and signed **webhooks** for other systems.
- In-app **User guide** (Settings → User guide) in all three languages.
- Light and dark mode.

---

## Getting started

Requirements: PHP 8.4, Composer, Node 22, MySQL 8.

```bash
git clone https://github.com/pasupathy-manikam-jr/crm.git
cd crm
composer install
cp .env.example .env
php artisan key:generate
# set DB_* in .env, then:
php artisan migrate --seed
npm install
npm run build
php artisan serve
```

Sign in with one of the demo accounts above (set `DEMO_LOGINS=true` in `.env` to pick them from a list on the sign-in page).
`php artisan migrate --seed` loads sample accounts, contacts, deals, cases, contracts and activities.

SLA escalations, contract reminders, mailbox reading and webhooks run from the scheduler, so production needs the usual cron entry:

```bash
* * * * * php /path/to/crm/artisan schedule:run >> /dev/null 2>&1
```

## Checks

```bash
composer ci:check   # lint, formatting, TypeScript, PHPStan and the test suite
```

## Deployment

Servers never run Node. On every push to `main`, GitHub Actions builds the front-end and publishes a `deploy`
branch (`main` + compiled assets); the server then runs:

```bash
cd ~/crm && bash scripts/deploy.sh
```
