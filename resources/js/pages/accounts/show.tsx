import { Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import AccountController from '@/actions/App/Http/Controllers/AccountController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordTabs } from '@/components/crm/record-tabs';
import { AccountFormDialog } from '@/components/crm/account-form-dialog';
import { ContactFormDialog } from '@/components/crm/contact-form-dialog';
import {
    customDetailItems,
    useCustomFields,
} from '@/components/crm/custom-fields';
import { DetailList } from '@/components/crm/detail-list';
import { RelatedService } from '@/components/crm/related-service';
import { SendEmailButton } from '@/components/crm/send-email-button';
import { StageBadge } from '@/components/crm/stage-badge';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import { formatDate, formatMoney } from '@/lib/utils';
import { index, show } from '@/routes/accounts';
import { show as showDeal } from '@/routes/deals';
import { show as showContact } from '@/routes/contacts';
import type {
    Account,
    Contact,
    Contract,
    Deal,
    Option,
    RecordTabData,
    SupportCase,
} from '@/types';

type Props = RecordTabData & {
    account: Account & {
        contacts: Contact[];
        deals: Deal[];
        support_cases: SupportCase[];
        contracts: Contract[];
    };
    owners: Option[];
};

export default function ShowAccount({
    account,
    owners,
    activities,
    activityTypes,
    notes,
    attachments,
    history,
}: Props) {
    const customFields = useCustomFields('account');
    const { currency } = usePage().props;
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [addingContact, setAddingContact] = useState(false);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Accounts', href: index() },
            { title: account.name, href: show(account.id) },
        ],
    });

    return (
        <>
            <Head title={account.name} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader
                    title={account.name}
                    description={account.industry ?? undefined}
                >
                    <SendEmailButton
                        record={{ type: 'account', id: account.id }}
                        to={account.email}
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
                    record={{ type: 'account', id: account.id }}
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
                            <DetailList
                                items={[
                                    { label: t('Phone'), value: account.phone },
                                    { label: t('Email'), value: account.email },
                                    {
                                        label: t('Website'),
                                        value: account.website && (
                                            <a
                                                href={account.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:underline"
                                            >
                                                {account.website.replace(
                                                    /^https?:\/\//,
                                                    '',
                                                )}
                                            </a>
                                        ),
                                    },
                                    {
                                        label: t('Billing address'),
                                        value: account.billing_address,
                                    },
                                    {
                                        label: t('Shipping address'),
                                        value: account.shipping_address,
                                    },
                                    {
                                        label: t('Owner'),
                                        value: account.owner.name,
                                    },
                                    {
                                        label: t('Added'),
                                        value: formatDate(account.created_at),
                                    },
                                    ...customDetailItems(
                                        customFields,
                                        account.custom_fields,
                                    ),
                                ]}
                            />

                            <Separator />

                            <section className="flex flex-col gap-4">
                                <h2 className="text-lg font-semibold">
                                    {t('Deals')}{' '}
                                    <span className="text-muted-foreground">
                                        {account.deals.length}
                                    </span>
                                </h2>
                                <DataTable
                                    columns={[
                                        {
                                            key: 'name',
                                            header: t('Deal'),
                                            cell: (d) => (
                                                <Link
                                                    href={showDeal(d.id)}
                                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                                >
                                                    {d.name}
                                                </Link>
                                            ),
                                        },
                                        {
                                            key: 'stage',
                                            header: t('Stage'),
                                            cell: (d) =>
                                                d.stage && (
                                                    <StageBadge
                                                        stage={d.stage}
                                                    />
                                                ),
                                        },
                                        {
                                            key: 'amount',
                                            header: t('Amount'),
                                            className:
                                                'text-right font-mono tabular-nums',
                                            cell: (d) =>
                                                formatMoney(d.amount, currency),
                                        },
                                        {
                                            key: 'close',
                                            header: t('Expected close'),
                                            className: 'font-mono tabular-nums',
                                            cell: (d) =>
                                                d.expected_close_date &&
                                                formatDate(
                                                    d.expected_close_date,
                                                ),
                                        },
                                    ]}
                                    rows={account.deals}
                                    rowKey={(d) => d.id}
                                    empty={t('No deals with this account yet.')}
                                />
                            </section>

                            <Separator />

                            <section className="flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="text-lg font-semibold">
                                        {t('Contacts')}{' '}
                                        <span className="text-muted-foreground">
                                            {account.contacts.length}
                                        </span>
                                    </h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddingContact(true)}
                                    >
                                        <PlusIcon data-icon="inline-start" />
                                        {t('Add contact')}
                                    </Button>
                                </div>
                                <DataTable
                                    columns={[
                                        {
                                            key: 'name',
                                            header: t('Name'),
                                            cell: (c) => (
                                                <Link
                                                    href={showContact(c.id)}
                                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                                >
                                                    {c.full_name}
                                                </Link>
                                            ),
                                        },
                                        {
                                            key: 'title',
                                            header: t('Job title'),
                                            cell: (c) => c.job_title,
                                        },
                                        {
                                            key: 'email',
                                            header: t('Email'),
                                            cell: (c) => c.email,
                                        },
                                        {
                                            key: 'phone',
                                            header: t('Phone'),
                                            cell: (c) => c.phone,
                                        },
                                    ]}
                                    rows={account.contacts}
                                    rowKey={(c) => c.id}
                                    empty={t(
                                        'No contacts at this account yet.',
                                    )}
                                />
                            </section>
                            <RelatedService
                                supportCases={account.support_cases}
                                contractList={account.contracts}
                                defaults={{
                                    account_id: account.id,
                                    contact_id: null,
                                }}
                            />
                        </>
                    }
                />
            </div>

            <AccountFormDialog
                account={editing ? account : null}
                owners={owners}
                onClose={() => setEditing(false)}
            />
            <ContactFormDialog
                contact={addingContact ? 'new' : null}
                owners={owners}
                accounts={[{ value: String(account.id), label: account.name }]}
                defaultAccountId={account.id}
                onClose={() => setAddingContact(false)}
            />
            <ConfirmDeleteDialog
                form={
                    deleting ? AccountController.destroy.form(account.id) : null
                }
                title={t('Delete :name?', { name: account.name })}
                description={t('Its contacts stay, without an account.')}
                onClose={() => setDeleting(false)}
            />
        </>
    );
}
