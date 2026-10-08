import { Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowsClockwiseIcon,
    CheckCircleIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import LeadController from '@/actions/App/Http/Controllers/LeadController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordTabs } from '@/components/crm/record-tabs';
import { ConvertLeadDialog } from '@/components/crm/convert-lead-dialog';
import {
    customDetailItems,
    useCustomFields,
} from '@/components/crm/custom-fields';
import { DetailList } from '@/components/crm/detail-list';
import { SendEmailButton } from '@/components/crm/send-email-button';
import type { LeadOptions } from '@/components/crm/lead-form-dialog';
import { LeadFormDialog } from '@/components/crm/lead-form-dialog';
import { LeadStatusBadge } from '@/components/crm/lead-status-badge';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { show as showContact } from '@/routes/contacts';
import { show as showDeal } from '@/routes/deals';
import { index, show } from '@/routes/leads';
import type { Lead, Option, RecordTabData } from '@/types';
import { t } from '@/lib/i18n';

type Props = RecordTabData &
    LeadOptions & {
        lead: Lead;
        accounts: Option[];
        stages: { id: number; name: string }[];
    };

export default function ShowLead({
    lead,
    owners,
    statuses,
    sources,
    accounts,
    stages,
    activities,
    activityTypes,
    notes,
    attachments,
    history,
}: Props) {
    const customFields = useCustomFields('lead');
    const [editing, setEditing] = useState(false);
    const [converting, setConverting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Leads', href: index() },
            { title: lead.full_name, href: show(lead.id) },
        ],
    });

    return (
        <>
            <Head title={lead.full_name} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader
                    title={lead.full_name}
                    description={
                        lead.job_title && lead.company
                            ? t(':title at :company', {
                                  title: lead.job_title,
                                  company: lead.company,
                              })
                            : lead.job_title || lead.company || undefined
                    }
                >
                    {!lead.converted_at && (
                        <Button onClick={() => setConverting(true)}>
                            <ArrowsClockwiseIcon data-icon="inline-start" />
                            {t('Convert')}
                        </Button>
                    )}
                    <SendEmailButton
                        record={{ type: 'lead', id: lead.id }}
                        to={lead.email}
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
                    record={{ type: 'lead', id: lead.id }}
                    owners={owners}
                    data={{
                        activities,
                        activityTypes,
                        notes,
                        attachments,
                        history,
                    }}
                    overview={
                        <>
                            {lead.converted_at && (
                                <Alert>
                                    <CheckCircleIcon />
                                    <AlertTitle>
                                        {t('Converted on :date', {
                                            date: formatDate(lead.converted_at),
                                        })}
                                    </AlertTitle>
                                    <AlertDescription>
                                        <span className="flex flex-wrap gap-x-4 gap-y-1">
                                            {lead.converted_account && (
                                                <Link
                                                    href={showAccount(
                                                        lead.converted_account
                                                            .id,
                                                    )}
                                                    className="underline underline-offset-4"
                                                >
                                                    {t('Account: :name', {
                                                        name: lead
                                                            .converted_account
                                                            .name,
                                                    })}
                                                </Link>
                                            )}
                                            {lead.converted_contact && (
                                                <Link
                                                    href={showContact(
                                                        lead.converted_contact
                                                            .id,
                                                    )}
                                                    className="underline underline-offset-4"
                                                >
                                                    {t('Contact: :name', {
                                                        name: `${lead.converted_contact.first_name} ${lead.converted_contact.last_name}`,
                                                    })}
                                                </Link>
                                            )}
                                            {lead.converted_deal && (
                                                <Link
                                                    href={showDeal(
                                                        lead.converted_deal.id,
                                                    )}
                                                    className="underline underline-offset-4"
                                                >
                                                    {t('Deal: :name', {
                                                        name: lead
                                                            .converted_deal
                                                            .name,
                                                    })}
                                                </Link>
                                            )}
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <DetailList
                                items={[
                                    {
                                        label: t('Status'),
                                        value: (
                                            <LeadStatusBadge
                                                status={lead.status}
                                                statuses={statuses}
                                            />
                                        ),
                                    },
                                    {
                                        label: t('Source'),
                                        value: sources.find(
                                            (s) => s.value === lead.source,
                                        )?.label,
                                    },
                                    {
                                        label: t('Company'),
                                        value: lead.company,
                                    },
                                    { label: t('Email'), value: lead.email },
                                    { label: t('Phone'), value: lead.phone },
                                    {
                                        label: t('Owner'),
                                        value: lead.owner.name,
                                    },
                                    {
                                        label: t('Added'),
                                        value: formatDate(lead.created_at),
                                    },
                                    ...customDetailItems(
                                        customFields,
                                        lead.custom_fields,
                                    ),
                                ]}
                            />
                        </>
                    }
                />
            </div>

            <LeadFormDialog
                lead={editing ? lead : null}
                options={{ owners, statuses, sources }}
                onClose={() => setEditing(false)}
            />
            <ConvertLeadDialog
                lead={lead}
                open={converting}
                accounts={accounts}
                stages={stages}
                onClose={() => setConverting(false)}
            />
            <ConfirmDeleteDialog
                form={deleting ? LeadController.destroy.form(lead.id) : null}
                title={t('Delete :name?', { name: lead.full_name })}
                description={t('The lead will be removed from your list.')}
                onClose={() => setDeleting(false)}
            />
        </>
    );
}
