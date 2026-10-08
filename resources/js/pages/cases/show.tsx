import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    ArrowCounterClockwiseIcon,
    CheckCircleIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import SupportCaseController from '@/actions/App/Http/Controllers/SupportCaseController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
    CasePriorityBadge,
    CaseStatusBadge,
    SlaBadge,
} from '@/components/crm/case-badges';
import type { CaseOptions } from '@/components/crm/case-form-dialog';
import { CaseFormDialog } from '@/components/crm/case-form-dialog';
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
import { formatDate, formatDue } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { index, show } from '@/routes/cases';
import { show as showContact } from '@/routes/contacts';
import type { RecordTabData, SupportCase } from '@/types';
import { t } from '@/lib/i18n';

type Props = RecordTabData & CaseOptions & { supportCase: SupportCase };

export default function ShowCase({
    supportCase: c,
    activities,
    activityTypes,
    notes,
    attachments,
    history,
    ...options
}: Props) {
    const customFields = useCustomFields('case');
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const done = c.status === 'resolved' || c.status === 'closed';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Cases', href: index() },
            { title: c.number, href: show(c.id) },
        ],
    });

    const setStatus = (status: SupportCase['status']) =>
        router.patch(
            SupportCaseController.updateStatus.url(c.id),
            { status },
            { preserveScroll: true },
        );

    return (
        <>
            <Head title={`${c.number} ${c.subject}`} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader title={c.subject} description={c.number}>
                    {done ? (
                        <Button
                            variant="outline"
                            onClick={() => setStatus('open')}
                        >
                            <ArrowCounterClockwiseIcon data-icon="inline-start" />
                            {t('Reopen')}
                        </Button>
                    ) : (
                        <Button onClick={() => setStatus('resolved')}>
                            <CheckCircleIcon data-icon="inline-start" />
                            {t('Resolve')}
                        </Button>
                    )}
                    <SendEmailButton
                        record={{ type: 'case', id: c.id }}
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
                    record={{ type: 'case', id: c.id }}
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
                                        {t('SLA due')}
                                    </span>
                                    <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
                                        {formatDue(c.sla_due_at)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('SLA')}
                                    </span>
                                    <SlaBadge supportCase={c} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Priority')}
                                    </span>
                                    <CasePriorityBadge priority={c.priority} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Status')}
                                    </span>
                                    <CaseStatusBadge status={c.status} />
                                </div>
                            </section>

                            {c.description && (
                                <p className="max-w-3xl whitespace-pre-line">
                                    {c.description}
                                </p>
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
                                    { label: t('Owner'), value: c.owner.name },
                                    {
                                        label: t('Opened'),
                                        value: formatDate(c.created_at),
                                    },
                                    {
                                        label: t('Resolved'),
                                        value:
                                            c.resolved_at &&
                                            formatDate(c.resolved_at),
                                    },
                                    {
                                        label: t('Escalated'),
                                        value:
                                            c.escalated_at &&
                                            formatDate(c.escalated_at),
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

            <CaseFormDialog
                key={editing ? c.id : 'closed'}
                supportCase={editing ? c : null}
                options={options}
                onClose={() => setEditing(false)}
            />
            <ConfirmDeleteDialog
                form={
                    deleting ? SupportCaseController.destroy.form(c.id) : null
                }
                title={t('Delete :name?', { name: c.number })}
                description={t('The case will be removed from your list.')}
                onClose={() => setDeleting(false)}
            />
        </>
    );
}
