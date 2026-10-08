import { Head, Link, router, setLayoutProps, usePage } from '@inertiajs/react';
import {
    ArrowsClockwiseIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import ContractController from '@/actions/App/Http/Controllers/ContractController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
    ContractStatusBadge,
    EndsInBadge,
} from '@/components/crm/contract-badges';
import type { ContractOptions } from '@/components/crm/contract-form-dialog';
import { ContractFormDialog } from '@/components/crm/contract-form-dialog';
import {
    customDetailItems,
    useCustomFields,
} from '@/components/crm/custom-fields';
import { DetailList } from '@/components/crm/detail-list';
import { RecordTabs } from '@/components/crm/record-tabs';
import { SendEmailButton } from '@/components/crm/send-email-button';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatMoney } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { show as showContact } from '@/routes/contacts';
import { index, show } from '@/routes/contracts';
import { show as showDeal } from '@/routes/deals';
import { show as showQuote } from '@/routes/quotes';
import type { Contract, RecordTabData } from '@/types';
import { t } from '@/lib/i18n';

type Props = RecordTabData & ContractOptions & { contract: Contract };

export default function ShowContract({
    contract: c,
    activities,
    activityTypes,
    notes,
    attachments,
    history,
    ...options
}: Props) {
    const customFields = useCustomFields('contract');
    const { currency } = usePage().props;
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Contracts', href: index() },
            { title: c.name, href: show(c.id) },
        ],
    });

    return (
        <>
            <Head title={c.name} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader title={c.name} description={c.account?.name}>
                    {c.renewal_deal ? (
                        <Button variant="outline" asChild>
                            <Link href={showDeal(c.renewal_deal.id)}>
                                <ArrowsClockwiseIcon data-icon="inline-start" />
                                {t('Renewal deal')}
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            onClick={() =>
                                router.post(ContractController.renew.url(c.id))
                            }
                        >
                            <ArrowsClockwiseIcon data-icon="inline-start" />
                            {t('Renew as deal')}
                        </Button>
                    )}
                    <SendEmailButton
                        record={{ type: 'contract', id: c.id }}
                        to={c.contact?.email}
                    />
                    <Button variant="outline" onClick={() => setEditing(true)}>
                        <PencilSimpleIcon data-icon="inline-start" />
                        {t('Edit')}
                    </Button>
                    <Button variant="outline" onClick={() => setDeleting(true)}>
                        <TrashIcon data-icon="inline-start" />
                        {t('Delete')}
                    </Button>
                </PageHeader>

                <RecordTabs
                    record={{ type: 'contract', id: c.id }}
                    owners={options.owners}
                    data={{
                        activities,
                        activityTypes,
                        notes,
                        attachments,
                        history,
                    }}
                    overview={
                        <>
                            <section className="flex flex-wrap items-end gap-x-10 gap-y-4 border bg-card p-5 shadow-sm shadow-primary/5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Value')}
                                    </span>
                                    <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                                        {formatMoney(c.value, currency)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Term')}
                                    </span>
                                    <span className="font-mono text-lg tabular-nums">
                                        {formatDate(c.start_date)} –{' '}
                                        {formatDate(c.end_date)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Status')}
                                    </span>
                                    <span className="flex gap-2">
                                        <ContractStatusBadge
                                            status={c.status}
                                        />
                                        <EndsInBadge contract={c} />
                                    </span>
                                </div>
                            </section>

                            {c.renewal_terms && (
                                <div className="flex max-w-3xl flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Renewal terms')}
                                    </span>
                                    <p className="whitespace-pre-line">
                                        {c.renewal_terms}
                                    </p>
                                </div>
                            )}

                            <Separator />

                            <DetailList
                                items={[
                                    {
                                        label: t('Account'),
                                        value: c.account && (
                                            <Link
                                                href={showAccount(c.account.id)}
                                                className="hover:underline"
                                            >
                                                {c.account.name}
                                            </Link>
                                        ),
                                    },
                                    {
                                        label: t('Contact'),
                                        value: c.contact && (
                                            <Link
                                                href={showContact(c.contact.id)}
                                                className="hover:underline"
                                            >
                                                {c.contact.first_name}{' '}
                                                {c.contact.last_name}
                                            </Link>
                                        ),
                                    },
                                    {
                                        label: t('From quote'),
                                        value: c.quote && (
                                            <Link
                                                href={showQuote(c.quote.id)}
                                                className="font-mono hover:underline"
                                            >
                                                {c.quote.number}
                                            </Link>
                                        ),
                                    },
                                    {
                                        label: t('Reminder'),
                                        value: `${t(':count days before end', { count: c.notice_days })}${c.reminded_at ? ` · ${t('sent :date', { date: formatDate(c.reminded_at) })}` : ''}`,
                                    },
                                    { label: t('Owner'), value: c.owner.name },
                                    {
                                        label: t('Added'),
                                        value: formatDate(c.created_at),
                                    },
                                    ...customDetailItems(
                                        customFields,
                                        c.custom_fields,
                                    ),
                                ]}
                            />
                        </>
                    }
                />
            </div>

            <ContractFormDialog
                key={editing ? c.id : 'closed'}
                contract={editing ? c : null}
                options={options}
                onClose={() => setEditing(false)}
            />
            <ConfirmDeleteDialog
                form={deleting ? ContractController.destroy.form(c.id) : null}
                title={t('Delete :name?', { name: c.name })}
                description={t('The contract will be removed from your list.')}
                onClose={() => setDeleting(false)}
            />
        </>
    );
}
