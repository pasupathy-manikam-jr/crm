import { Head, Link, router, setLayoutProps, usePage } from '@inertiajs/react';
import {
    CheckCircleIcon,
    HourglassIcon,
    SealCheckIcon,
    PaperPlaneTiltIcon,
    PencilSimpleIcon,
    PrinterIcon,
    TrashIcon,
    XCircleIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import QuoteApprovalController from '@/actions/App/Http/Controllers/QuoteApprovalController';
import QuoteController from '@/actions/App/Http/Controllers/QuoteController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { QuoteStatusBadge } from '@/components/crm/quote-status-badge';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { TextField } from '@/components/form-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { show as showDeal } from '@/routes/deals';
import { edit, index, show } from '@/routes/quotes';
import type { Quote } from '@/types';
import { t } from '@/lib/i18n';

type SourceEmail = {
    from_email: string;
    from_name: string | null;
    subject: string | null;
    body: string | null;
    received_at: string;
};

type Props = {
    quote: Quote;
    company: string;
    canApprove: boolean;
    sourceEmail: SourceEmail | null;
};

export default function ShowQuote({
    quote,
    company,
    canApprove,
    sourceEmail,
}: Props) {
    const { currency } = usePage().props;
    const [deleting, setDeleting] = useState(false);
    const [deciding, setDeciding] = useState<'approved' | 'rejected' | null>(
        null,
    );
    const locked = quote.status === 'pending_approval';
    const money = (v: string) => formatMoney(v, currency);
    const setStatus = (status: Quote['status']) =>
        router.patch(
            QuoteController.updateStatus.url(quote.id),
            { status },
            { preserveScroll: true },
        );

    setLayoutProps({
        breadcrumbs: [
            { title: 'Quotes', href: index() },
            { title: quote.number, href: show(quote.id) },
        ],
    });

    const account = quote.account as {
        id: number;
        name: string;
        billing_address?: string | null;
        email?: string | null;
        phone?: string | null;
    } | null;

    return (
        <>
            <Head title={quote.number} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                        <h1 className="font-mono text-2xl font-semibold tracking-tight">
                            {quote.number}
                        </h1>
                        <QuoteStatusBadge status={quote.status} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canApprove && (
                            <>
                                <Button onClick={() => setDeciding('approved')}>
                                    <CheckCircleIcon data-icon="inline-start" />
                                    {t('Approve')}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeciding('rejected')}
                                >
                                    <XCircleIcon data-icon="inline-start" />
                                    {t('Reject')}
                                </Button>
                            </>
                        )}
                        {quote.status === 'draft' && (
                            <Button
                                variant="outline"
                                onClick={() => setStatus('sent')}
                            >
                                <PaperPlaneTiltIcon data-icon="inline-start" />
                                {t('Mark sent')}
                            </Button>
                        )}
                        {quote.status === 'sent' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setStatus('accepted')}
                                >
                                    <CheckCircleIcon data-icon="inline-start" />
                                    {t('Accepted')}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setStatus('declined')}
                                >
                                    <XCircleIcon data-icon="inline-start" />
                                    {t('Declined')}
                                </Button>
                            </>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <PrinterIcon data-icon="inline-start" />
                            {t('Print / PDF')}
                        </Button>
                        {!locked && (
                            <Button variant="outline" asChild>
                                <Link href={edit(quote.id)}>
                                    <PencilSimpleIcon data-icon="inline-start" />
                                    {t('Edit')}
                                </Link>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => setDeleting(true)}
                        >
                            <TrashIcon data-icon="inline-start" />
                            {t('Delete')}
                        </Button>
                    </div>
                </div>

                {locked && (
                    <Alert className="mx-auto w-full max-w-4xl border-warning/40 bg-warning/10 print:hidden">
                        <HourglassIcon />
                        <AlertTitle>{t('Waiting for approval')}</AlertTitle>
                        <AlertDescription>
                            {t(
                                'A workflow rule needs a manager to approve this quote before it can be edited or sent.',
                            )}
                        </AlertDescription>
                    </Alert>
                )}
                {quote.approval_decision && (
                    <Alert
                        variant={
                            quote.approval_decision === 'rejected'
                                ? 'destructive'
                                : 'default'
                        }
                        className={cn(
                            'mx-auto w-full max-w-4xl print:hidden',
                            quote.approval_decision === 'approved' &&
                                'border-success/40 bg-success/10 text-success',
                        )}
                    >
                        {quote.approval_decision === 'rejected' ? (
                            <XCircleIcon />
                        ) : (
                            <SealCheckIcon />
                        )}
                        <AlertTitle>
                            {(() => {
                                const replace = {
                                    name:
                                        quote.approver?.name ?? t('a manager'),
                                    date: quote.approval_at
                                        ? formatDate(quote.approval_at)
                                        : '',
                                };

                                if (quote.approval_decision === 'rejected') {
                                    return quote.approval_at
                                        ? t(
                                              'Rejected by :name on :date',
                                              replace,
                                          )
                                        : t('Rejected by :name', replace);
                                }

                                return quote.approval_at
                                    ? t('Approved by :name on :date', replace)
                                    : t('Approved by :name', replace);
                            })()}
                        </AlertTitle>
                        {quote.approval_note && (
                            <AlertDescription>
                                {quote.approval_note}
                            </AlertDescription>
                        )}
                    </Alert>
                )}

                {/* The document: what prints. */}
                <article className="mx-auto flex w-full max-w-4xl flex-col gap-8 border bg-card p-8 shadow-sm shadow-primary/5 print:max-w-none print:border-0 print:p-0 print:shadow-none">
                    <header className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-xl font-semibold">
                                {company}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {t('Prepared by :name', {
                                    name: quote.owner.name,
                                })}
                            </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right">
                            <span className="text-2xl font-semibold tracking-tight">
                                {t('Quotation')}
                            </span>
                            <span className="font-mono">{quote.number}</span>
                            <span className="text-sm text-muted-foreground">
                                {t('Date :date', {
                                    date: formatDate(quote.created_at),
                                })}
                            </span>
                            {quote.valid_until && (
                                <span className="text-sm text-muted-foreground">
                                    {t('Valid until :date', {
                                        date: formatDate(quote.valid_until),
                                    })}
                                </span>
                            )}
                        </div>
                    </header>

                    <section className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">
                            {t('Prepared for')}
                        </span>
                        {account ? (
                            <Link
                                href={showAccount(account.id)}
                                className="font-semibold hover:underline print:no-underline"
                            >
                                {account.name}
                            </Link>
                        ) : (
                            <span className="text-muted-foreground">
                                {t('No account')}
                            </span>
                        )}
                        {quote.contact && (
                            <span>
                                {t('Attn: :name', {
                                    name: `${quote.contact.first_name} ${quote.contact.last_name}`,
                                })}
                                {quote.contact.email
                                    ? ` · ${quote.contact.email}`
                                    : ''}
                            </span>
                        )}
                        {account?.billing_address && (
                            <span className="text-sm whitespace-pre-line text-muted-foreground">
                                {account.billing_address}
                            </span>
                        )}
                        {quote.deal && (
                            <span className="text-sm text-muted-foreground print:hidden">
                                {t('For deal')}{' '}
                                <Link
                                    href={showDeal(quote.deal.id)}
                                    className="text-primary hover:underline"
                                >
                                    {quote.deal.name}
                                </Link>
                            </span>
                        )}
                    </section>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="py-2 pr-3 font-medium">#</th>
                                <th className="py-2 pr-3 font-medium">
                                    {t('Description')}
                                </th>
                                <th className="py-2 pr-3 text-right font-medium">
                                    {t('Qty')}
                                </th>
                                <th className="py-2 pr-3 text-right font-medium">
                                    {t('Price')}
                                </th>
                                <th className="py-2 pr-3 text-right font-medium">
                                    {t('Disc.')}
                                </th>
                                <th className="py-2 pr-3 text-right font-medium">
                                    {t('Tax')}
                                </th>
                                <th className="py-2 text-right font-medium">
                                    {t('Net')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="font-mono tabular-nums">
                            {quote.items?.map((i, n) => (
                                <tr key={i.id ?? n} className="border-b">
                                    <td className="py-2 pr-3 text-muted-foreground">
                                        {n + 1}
                                    </td>
                                    <td className="py-2 pr-3 font-sans">
                                        {i.description}
                                    </td>
                                    <td className="py-2 pr-3 text-right">
                                        {Number(i.quantity)}
                                    </td>
                                    <td className="py-2 pr-3 text-right">
                                        {money(i.unit_price)}
                                    </td>
                                    <td className="py-2 pr-3 text-right">
                                        {Number(i.discount_percent)
                                            ? `${Number(i.discount_percent)}%`
                                            : '—'}
                                    </td>
                                    <td className="py-2 pr-3 text-right">
                                        {Number(i.tax_rate)
                                            ? `${Number(i.tax_rate)}%`
                                            : '—'}
                                    </td>
                                    <td className="py-2 text-right">
                                        {money(i.line_total ?? '0')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex flex-wrap items-start justify-between gap-8">
                        <div className="max-w-md min-w-0 flex-1">
                            {quote.notes && (
                                <>
                                    <span className="text-sm text-muted-foreground">
                                        {t('Notes and terms')}
                                    </span>
                                    <p className="mt-1 text-sm whitespace-pre-line">
                                        {quote.notes}
                                    </p>
                                </>
                            )}
                        </div>
                        <dl className="grid w-72 grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 font-mono tabular-nums">
                            <dt className="font-sans text-muted-foreground">
                                {t('Subtotal')}
                            </dt>
                            <dd className="text-right">
                                {money(quote.subtotal)}
                            </dd>
                            <dt className="font-sans text-muted-foreground">
                                {t('Discount')}
                            </dt>
                            <dd className="text-right">
                                −{money(quote.discount_total)}
                            </dd>
                            <dt className="font-sans text-muted-foreground">
                                {t('Tax')}
                            </dt>
                            <dd className="text-right">
                                {money(quote.tax_total)}
                            </dd>
                            <dt className="border-t pt-2 font-sans font-semibold">
                                {t('Total (:currency)', { currency })}
                            </dt>
                            <dd className="border-t pt-2 text-right text-lg font-semibold">
                                {money(quote.total)}
                            </dd>
                        </dl>
                    </div>
                </article>

                {sourceEmail && (
                    <aside className="mx-auto flex w-full max-w-4xl flex-col gap-2 border bg-muted/40 p-5 print:hidden">
                        <span className="text-xs text-muted-foreground">
                            {t(
                                'Drafted by Claude from this email · check every line before sending',
                            )}
                        </span>
                        <span className="font-medium">
                            {sourceEmail.subject ?? t('(no subject)')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {sourceEmail.from_name ?? sourceEmail.from_email}{' '}
                            &lt;{sourceEmail.from_email}&gt; ·{' '}
                            {formatDate(sourceEmail.received_at)}
                        </span>
                        <p className="max-h-80 overflow-y-auto text-sm whitespace-pre-line">
                            {sourceEmail.body}
                        </p>
                    </aside>
                )}
            </div>

            <RecordFormDialog
                open={deciding !== null}
                title={
                    deciding === 'rejected'
                        ? t('Reject :number?', { number: quote.number })
                        : t('Approve :number?', { number: quote.number })
                }
                description={
                    deciding === 'rejected'
                        ? t(
                              'It goes back to the owner as a draft with your reason.',
                          )
                        : t('It becomes a draft the owner can send.')
                }
                form={QuoteApprovalController.form(quote.id)}
                formKey={deciding ?? 'closed'}
                submitLabel={
                    deciding === 'rejected' ? t('Reject') : t('Approve')
                }
                onClose={() => setDeciding(null)}
            >
                {(errors) => (
                    <>
                        <input
                            type="hidden"
                            name="decision"
                            value={deciding ?? ''}
                        />
                        <TextField
                            id="approval-note"
                            label={
                                deciding === 'rejected'
                                    ? t('Reason')
                                    : t('Note (optional)')
                            }
                            name="note"
                            multiline
                            error={errors.note}
                        />
                    </>
                )}
            </RecordFormDialog>
            <ConfirmDeleteDialog
                form={deleting ? QuoteController.destroy.form(quote.id) : null}
                title={t('Delete :name?', { name: quote.number })}
                description={t('The quote and its lines will be removed.')}
                onClose={() => setDeleting(false)}
            />
        </>
    );
}
