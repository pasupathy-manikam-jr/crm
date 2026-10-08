import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowClockwiseIcon,
    EnvelopeOpenIcon,
    UserPlusIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import InboxController from '@/actions/App/Http/Controllers/InboxController';
import { DataTable } from '@/components/data-table';
import { ListPagination } from '@/components/list-pagination';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDue } from '@/lib/utils';
import { show as showCase } from '@/routes/cases';
import { show as showContact } from '@/routes/contacts';
import { index } from '@/routes/inbox';
import { show as showLead } from '@/routes/leads';
import { show as showQuote } from '@/routes/quotes';
import type { Paginated } from '@/types';
import { intlLocale, t } from '@/lib/i18n';

type Email = {
    id: number;
    from_email: string;
    from_name: string | null;
    subject: string | null;
    body: string;
    received_at: string;
    status: 'matched' | 'unmatched' | 'ignored';
    ai_status:
        | 'pending'
        | 'drafted'
        | 'not_quote'
        | 'failed'
        | 'skipped'
        | null;
    ai_confidence: string | null;
    ai_cost: string | null;
    ai_error: string | null;
    mailbox: string | null;
    contact: { id: number; name: string } | null;
    lead: { id: number; name: string } | null;
    case: { id: number; number: string } | null;
    quote: { id: number; number: string } | null;
};

type Props = {
    emails: Paginated<Email>;
    tab: string;
    tabs: { value: string; label: string; count: number }[];
    usage: { emails: number; tokens: number; cost: number };
};

const aiBadge: Record<
    NonNullable<Email['ai_status']>,
    ['info' | 'success' | 'outline' | 'destructive' | 'warning', string]
> = {
    pending: ['info', 'Reading…'],
    drafted: ['success', 'Quote drafted'],
    not_quote: ['outline', 'Not a request'],
    failed: ['destructive', 'Failed'],
    skipped: ['warning', 'Skipped'],
};

const linkClass = 'text-primary underline-offset-4 hover:underline';

export default function Inbox({ emails, tab, tabs, usage }: Props) {
    const [reading, setReading] = useState<Email | null>(null);

    return (
        <>
            <Head title={t('Inbox')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Inbox')}
                    description={t(
                        "Emails read from your mailboxes. Turn unknown senders into leads, review quote drafts, and retry anything the AI couldn't read.",
                    )}
                >
                    <div className="text-right text-sm text-muted-foreground">
                        {t(
                            'AI this month: :emails emails · :tokens tokens · US$:cost',
                            {
                                emails: usage.emails,
                                tokens: usage.tokens.toLocaleString(
                                    intlLocale(),
                                ),
                                cost: usage.cost.toFixed(2),
                            },
                        )}
                    </div>
                </PageHeader>

                <Tabs
                    value={tab}
                    onValueChange={(value) =>
                        router.get(
                            index.url(),
                            { tab: value },
                            { preserveState: true },
                        )
                    }
                >
                    <TabsList>
                        {tabs.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={item.value}
                                className="gap-2"
                            >
                                {item.label}
                                <Badge
                                    variant={
                                        item.value === 'failed' &&
                                        item.count > 0
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    {item.count}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <DataTable
                    columns={[
                        {
                            key: 'received',
                            header: t('Received'),
                            className: 'font-mono text-sm tabular-nums',
                            cell: (e) => formatDue(e.received_at),
                        },
                        {
                            key: 'from',
                            header: t('From'),
                            hideable: false,
                            cell: (e) => (
                                <span className="flex flex-col">
                                    <span className="font-medium">
                                        {e.from_name ?? e.from_email}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {e.from_email}
                                    </span>
                                </span>
                            ),
                        },
                        {
                            key: 'subject',
                            header: t('Subject'),
                            cell: (e) => (
                                <button
                                    type="button"
                                    onClick={() => setReading(e)}
                                    className={`max-w-sm truncate text-left ${linkClass}`}
                                >
                                    {e.subject ?? t('(no subject)')}
                                </button>
                            ),
                        },
                        {
                            key: 'linked',
                            header: t('Linked to'),
                            cell: (e) => (
                                <span className="flex flex-col gap-0.5 text-sm">
                                    {e.contact && (
                                        <Link
                                            href={showContact(e.contact.id)}
                                            className={linkClass}
                                        >
                                            {e.contact.name}
                                        </Link>
                                    )}
                                    {e.lead && (
                                        <Link
                                            href={showLead(e.lead.id)}
                                            className={linkClass}
                                        >
                                            {t('Lead: :name', {
                                                name: e.lead.name,
                                            })}
                                        </Link>
                                    )}
                                    {e.case && (
                                        <Link
                                            href={showCase(e.case.id)}
                                            className={`font-mono ${linkClass}`}
                                        >
                                            {e.case.number}
                                        </Link>
                                    )}
                                    {e.quote && (
                                        <Link
                                            href={showQuote(e.quote.id)}
                                            className={`font-mono ${linkClass}`}
                                        >
                                            {e.quote.number}
                                        </Link>
                                    )}
                                    {e.status === 'unmatched' && !e.lead && (
                                        <Badge variant="warning">
                                            {t('Unknown sender')}
                                        </Badge>
                                    )}
                                    {e.status === 'ignored' && (
                                        <Badge variant="outline">
                                            {t('Ignored (domain)')}
                                        </Badge>
                                    )}
                                </span>
                            ),
                        },
                        {
                            key: 'ai',
                            header: t('AI'),
                            cell: (e) =>
                                e.ai_status && (
                                    <span className="flex flex-col items-start gap-0.5">
                                        <Badge
                                            variant={aiBadge[e.ai_status][0]}
                                            title={e.ai_error ?? undefined}
                                        >
                                            {t(aiBadge[e.ai_status][1])}
                                        </Badge>
                                        {e.ai_confidence !== null && (
                                            <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                                {Math.round(
                                                    Number(e.ai_confidence) *
                                                        100,
                                                )}
                                                % · US$
                                                {Number(e.ai_cost).toFixed(4)}
                                            </span>
                                        )}
                                    </span>
                                ),
                        },
                    ]}
                    rows={emails.data}
                    rowKey={(e) => e.id}
                    empty={
                        tab === 'unmatched'
                            ? t('No emails from unknown senders.')
                            : t(
                                  'Nothing here yet. Mailboxes are read every 5 minutes once switched on (Admin → Mailboxes).',
                              )
                    }
                    actions={(e) => (
                        <>
                            <DropdownMenuItem onSelect={() => setReading(e)}>
                                <EnvelopeOpenIcon />
                                {t('Read email')}
                            </DropdownMenuItem>
                            {e.status === 'unmatched' && !e.lead && (
                                <DropdownMenuItem
                                    onSelect={() =>
                                        router.post(
                                            InboxController.createLead.url(
                                                e.id,
                                            ),
                                        )
                                    }
                                >
                                    <UserPlusIcon />
                                    {t('Create lead')}
                                </DropdownMenuItem>
                            )}
                            {(e.ai_status === 'failed' ||
                                e.ai_status === 'skipped') && (
                                <DropdownMenuItem
                                    onSelect={() =>
                                        router.post(
                                            InboxController.retry.url(e.id),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <ArrowClockwiseIcon />
                                    {t('Retry AI')}
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                />
                <ListPagination page={emails} />
            </div>

            <Dialog
                open={reading !== null}
                onOpenChange={(open) => !open && setReading(null)}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {reading?.subject ?? t('(no subject)')}
                        </DialogTitle>
                        <DialogDescription>
                            {reading?.from_name ?? reading?.from_email} &lt;
                            {reading?.from_email}&gt; ·{' '}
                            {reading && formatDue(reading.received_at)} ·{' '}
                            {reading?.mailbox}
                        </DialogDescription>
                    </DialogHeader>
                    <p className="max-h-[60svh] overflow-y-auto text-sm whitespace-pre-line">
                        {reading?.body}
                    </p>
                    {reading?.ai_error && (
                        <p className="text-sm text-destructive">
                            {t('AI: :error', { error: reading.ai_error })}
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

Inbox.layout = { breadcrumbs: [{ title: 'Inbox', href: index() }] };
