import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

export type GuideSection = {
    id: string;
    title: string;
    /** Who sees the section; everyone when left out. */
    who?: 'catalog' | 'admin';
    /** Spans both columns on wide screens. */
    wide?: boolean;
    body: ReactNode;
};

/** English user guide. ms.tsx and zh_CN.tsx mirror it section for section (same ids). */
export const sections: GuideSection[] = [
    {
        id: 'journey',
        title: 'From start to end',
        wide: true,
        body: (
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                    <h3 className="font-semibold">A. Set up once (admin)</h3>
                    <ol className="ml-5 list-decimal space-y-1.5">
                        <li>
                            <b>Admin → Teams</b>, then <b>Admin → Users</b>: add
                            everyone with a role (Admin, Sales manager, Sales
                            rep) and a team.
                        </li>
                        <li>
                            <b>Admin → Products</b>: your catalogue with prices
                            and tax.
                        </li>
                        <li>
                            Optional: <b>Custom fields</b> for anything extra
                            you track, <b>Holidays</b> for the SLA clock,{' '}
                            <b>Workflows</b> (e.g. quotes over 15% discount need
                            approval), a <b>Website form</b> on your site,{' '}
                            <b>Mailboxes</b> (support inbox → cases, sales inbox
                            → quote drafts), and <b>Webhooks</b> / API tokens
                            for other systems.
                        </li>
                    </ol>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">B. Win a customer</h3>
                    <ol className="ml-5 list-decimal space-y-1.5" start={4}>
                        <li>
                            A <b>lead</b> comes in: Add lead, Import, your
                            website form, or an unknown sender in the Inbox →
                            Create lead.
                        </li>
                        <li>
                            Work it: <b>Log activity</b> for each call, meeting
                            or task with a due date (it shows in Tasks and the
                            Calendar), <b>Send email</b>, add notes, and move
                            its status New → Contacted → Qualified.
                        </li>
                        <li>
                            <b>Convert</b> the lead: you get an account, a
                            contact and a deal.
                        </li>
                        <li>
                            Move the <b>deal</b> along the board as it
                            progresses; the dashboard shows your pipeline.
                        </li>
                        <li>
                            On the deal, <b>Create quote</b>, add product lines
                            and save. If it needs approval, a manager approves
                            it. Then <b>Print / PDF</b>, send it to the customer
                            and <b>Mark sent</b>.
                        </li>
                        <li>
                            The customer agrees: mark the quote <b>Accepted</b>{' '}
                            and drag the deal to <b>Won</b>.
                        </li>
                    </ol>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">C. Keep the customer</h3>
                    <ol className="ml-5 list-decimal space-y-1.5" start={10}>
                        <li>
                            On the account, <b>Add contract</b>: the quote, the
                            term, the value and how many days before the end to
                            remind you.
                        </li>
                        <li>
                            Support: the customer emails your support mailbox (a
                            case opens by itself), or you use <b>Open case</b>{' '}
                            on the account. Work it and <b>Resolve</b> it before
                            its SLA runs out.
                        </li>
                        <li>
                            Before the contract ends you get a “Renew …” task
                            and email: open the contract, <b>Renew as deal</b>,
                            and you're back at step 7.
                        </li>
                    </ol>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">D. Every day</h3>
                    <ul className="ml-5 list-disc space-y-1.5">
                        <li>
                            Start on <b>Tasks</b> (or the <b>Calendar</b>):
                            clear what's overdue and due today.
                        </li>
                        <li>
                            Check the red <b>Cases</b> number: those are past
                            their SLA.
                        </li>
                        <li>
                            Managers: the <b>Dashboard</b> for the pipeline,{' '}
                            <b>Reports</b> for anything else, and quotes waiting
                            for your approval.
                        </li>
                    </ul>
                </div>
            </div>
        ),
    },
    {
        id: 'start',
        title: 'Getting around',
        body: (
            <>
                <p>
                    The top bar holds every section. Press <Kbd>⌘K</Kbd> (
                    <Kbd>Ctrl K</Kbd> on Windows) anywhere to find a lead,
                    contact, account, deal, case or contract by name, number,
                    email or phone, or to jump to a page.
                </p>
                <p>
                    What you see depends on your role: <b>sales reps</b> see
                    their own records, <b>sales managers</b> see their team's,
                    and <b>admins</b> see everything. Someone else's record
                    simply doesn't appear.
                </p>
                <p>
                    Red numbers in the bar are things needing you: <b>Cases</b>{' '}
                    past their SLA and <b>Tasks</b> due today or overdue.
                </p>
            </>
        ),
    },
    {
        id: 'lists',
        title: 'Lists',
        body: (
            <ul>
                <li>
                    Search, filter by owner, status and any dropdown or yes/no
                    custom field, and click a column header to sort (custom
                    fields too).
                </li>
                <li>
                    <b>Views</b> saves the current search, filters and sort
                    under a name, just for you.
                </li>
                <li>
                    <b>Columns</b> hides or shows columns; the two buttons
                    beside it switch between list and grid (cards).
                </li>
                <li>
                    Every row's <b>⋯</b> menu holds Edit and Delete; click a
                    name to open the record.
                </li>
                <li>
                    Leads, contacts and accounts have <b>Import</b> (CSV, you
                    match the columns) and <b>Export</b> (what the list shows
                    now), plus <b>Find duplicates</b> to merge copies field by
                    field.
                </li>
            </ul>
        ),
    },
    {
        id: 'records',
        title: 'Record pages',
        body: (
            <>
                <p>Every record opens on tabs:</p>
                <ul>
                    <li>
                        <b>Overview</b> — its details and related records.
                    </li>
                    <li>
                        <b>Activities</b> — calls, meetings, tasks and emails;
                        tick one to mark it done.
                    </li>
                    <li>
                        <b>Notes</b> and <b>Files</b> — anything worth keeping.
                    </li>
                    <li>
                        <b>History</b> — who changed what, and when.
                    </li>
                </ul>
                <p>
                    <b>Send email</b> on a record sends from the CRM with your
                    name, replies go to your own inbox, and the email is logged
                    on the record.
                </p>
            </>
        ),
    },
    {
        id: 'leads',
        title: 'Leads',
        body: (
            <>
                <p>
                    A lead is someone who may buy. Add them with <b>Add lead</b>
                    , or let your website form create them. If someone with the
                    same email, phone or name already exists, you're warned so
                    you can merge them with <b>Find duplicates</b>.
                </p>
                <p>
                    Once qualified, press <b>Convert</b>: the CRM makes a
                    contact, links or creates the account, and can open a deal
                    in one step. A converted lead stays for reference and links
                    to what it became.
                </p>
            </>
        ),
    },
    {
        id: 'accounts',
        title: 'Accounts and contacts',
        body: (
            <p>
                An <b>account</b> is a company; <b>contacts</b> are its people.
                An account's page lists its contacts, deals, cases and
                contracts, with buttons to add a contact, open a case or add a
                contract already linked to it.
            </p>
        ),
    },
    {
        id: 'deals',
        title: 'Deals',
        body: (
            <>
                <p>
                    Deals open on a <b>board</b>: drag a card to another stage
                    (or use its menu). Moving it to Won or Lost closes it. Each
                    stage sets the win probability, so the dashboard can show a
                    weighted pipeline. Switch to <b>list</b> for sorting,
                    columns and saved views.
                </p>
                <p>
                    On a deal, <b>Create quote</b> starts a quote with the
                    account and contact filled in.
                </p>
            </>
        ),
    },
    {
        id: 'quotes',
        title: 'Quotes',
        body: (
            <>
                <p>
                    Add lines from the product list or type your own; totals,
                    discounts and tax are worked out for you. A quote moves
                    Draft → <b>Mark sent</b> → <b>Accepted</b> or{' '}
                    <b>Declined</b>. <b>Print / PDF</b> gives a clean page to
                    print or save as PDF.
                </p>
                <p>
                    If your company has an approval rule (for example, discounts
                    over 15%), a matching quote shows{' '}
                    <Badge variant="warning">Pending approval</Badge> and is
                    locked until a manager approves or rejects it with a reason.
                    Editing an approved quote asks again.
                </p>
                <p>
                    When a sales mailbox has quote drafting on, Claude reads
                    quote requests from known customers and drafts the quote for
                    you. The email shows under the draft; items it couldn't
                    match are priced at 0 and listed in the notes. Check every
                    line before you send it. Nothing is sent by itself.
                </p>
            </>
        ),
    },
    {
        id: 'cases',
        title: 'Cases (support)',
        body: (
            <>
                <p>
                    A case is a customer problem. Its priority sets the deadline
                    in working time: <b>Urgent</b> 4 hours, <b>High</b> 1
                    working day, <b>Normal</b> 3, <b>Low</b> 5 (weekends and
                    holidays skipped). The list shows time left and turns red
                    when overdue.
                </p>
                <p>
                    <b>Resolve</b> closes it and records whether the SLA was
                    met; <b>Reopen</b> brings it back. Emails to a support
                    mailbox open cases by themselves; replies in the same thread
                    (or with the case number in the subject) are added as notes
                    and reopen a resolved case. A case that misses its deadline
                    is escalated once: its owner and their team's managers get
                    an email.
                </p>
            </>
        ),
    },
    {
        id: 'contracts',
        title: 'Contracts',
        body: (
            <p>
                Record each agreement's term, value and renewal terms. A set
                number of days before it ends (30 by default) the owner gets a
                “Renew …” task and an email. <b>Renew as deal</b> opens next
                term's deal with the same account and value. Ended contracts
                turn Expired by themselves.
            </p>
        ),
    },
    {
        id: 'tasks',
        title: 'Tasks and calendar',
        body: (
            <>
                <p>
                    <b>Tasks</b> lists your activities by Overdue, Today,
                    Upcoming, No date and Done. <b>Log activity</b> adds one;
                    tick it when done.
                </p>
                <p>
                    <b>Calendar</b> shows the month. Click an activity to edit
                    it, use <b>+</b> on a day to add one, or drag it to another
                    day to reschedule (its time stays). Managers can switch to
                    everyone's or one person's calendar.
                </p>
            </>
        ),
    },
    {
        id: 'reports',
        title: 'Dashboard and reports',
        body: (
            <p>
                The <b>Dashboard</b> shows open and weighted pipeline, this
                month's wins and new leads, your due tasks and deals closing
                soon. <b>Reports</b> lets you pick a record type, group it (by
                owner, stage, status, source, month…), count or total it, limit
                the dates, and export the result as CSV.
            </p>
        ),
    },
    {
        id: 'settings',
        title: 'Your settings',
        body: (
            <ul>
                <li>
                    <b>Profile</b> — name and email.
                </li>
                <li>
                    <b>Security</b> — change your password and turn on
                    two-factor sign-in. Forgot it? Use <b>Forgot password</b> on
                    the sign-in page.
                </li>
                <li>
                    <b>Appearance</b> — light, dark or follow your device.
                </li>
                <li>
                    <b>API tokens</b> — let another system read (or change)
                    records as you. Copy the token when it's shown; it isn't
                    shown again. Revoke it to cut access at once.
                </li>
            </ul>
        ),
    },
    {
        id: 'catalog',
        title: 'Products, website forms and inbox',
        who: 'catalog',
        body: (
            <ul>
                <li>
                    <b>Products</b> — the catalogue quotes pick from: name, SKU,
                    price and tax.
                </li>
                <li>
                    <b>Website forms</b> — make a form, paste its embed code on
                    your site, and each submission becomes a lead with the
                    message as a note.
                </li>
                <li>
                    <b>Inbox</b> — emails read from your mailboxes. Turn unknown
                    senders into leads with <b>Create lead</b>, review quote
                    drafts (the email shows under the quote), and{' '}
                    <b>Retry AI</b> on anything that failed.
                </li>
            </ul>
        ),
    },
    {
        id: 'admin',
        title: 'Administration',
        who: 'admin',
        body: (
            <ul>
                <li>
                    <b>Users</b> and <b>Teams</b> — add people, set their role
                    and team. Managers see their team's records.
                </li>
                <li>
                    <b>Custom fields</b> — extra fields on any record type.
                    Inactive hides a field but keeps its values; Delete removes
                    both.
                </li>
                <li>
                    <b>Workflows</b> — “when a record is created/updated and
                    these conditions match, then set a field, create a task,
                    send an email, or require quote approval.” Conditions can
                    test any field (is, is not, more or less than, contains,
                    empty, changed). Task and email text can use the record's
                    values, like <code>{'{first_name}'}</code>, plus{' '}
                    <code>{'{owner}'}</code> and a link with{' '}
                    <code>{'{url}'}</code>.
                </li>
                <li>
                    <b>Holidays</b> — days the SLA clock skips. Working hours
                    are set on the server.
                </li>
                <li>
                    <b>Mailboxes</b> — connect a support or sales inbox (for
                    Gmail: imap.gmail.com, port 993, SSL and an app password).
                    Choose whether its emails open cases and whether quote
                    requests become draft quotes. Use <b>Test connection</b>,
                    then switch it on; it's read every 5 minutes.
                </li>
                <li>
                    <b>Webhooks</b> — tell another system when records change.
                    Pick events, give the receiver the signing secret, and use{' '}
                    <b>Send test</b>.
                </li>
            </ul>
        ),
    },
];

export function Kbd({ children }: { children: ReactNode }) {
    return (
        <kbd className="border bg-muted px-1 py-0.5 font-mono text-xs">
            {children}
        </kbd>
    );
}
