import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import ContactController from '@/actions/App/Http/Controllers/ContactController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordTabs } from '@/components/crm/record-tabs';
import { ContactFormDialog } from '@/components/crm/contact-form-dialog';
import {
    customDetailItems,
    useCustomFields,
} from '@/components/crm/custom-fields';
import { DetailList } from '@/components/crm/detail-list';
import { RelatedService } from '@/components/crm/related-service';
import { SendEmailButton } from '@/components/crm/send-email-button';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { index, show } from '@/routes/contacts';
import type {
    Contact,
    Contract,
    Option,
    RecordTabData,
    SupportCase,
} from '@/types';

type Props = RecordTabData & {
    contact: Contact & {
        support_cases: SupportCase[];
        contracts: Contract[];
    };
    owners: Option[];
    accounts: Option[];
};

export default function ShowContact({
    contact,
    owners,
    accounts,
    activities,
    activityTypes,
    notes,
    attachments,
    history,
}: Props) {
    const customFields = useCustomFields('contact');
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Contacts', href: index() },
            { title: contact.full_name, href: show(contact.id) },
        ],
    });

    const subtitle =
        contact.job_title && contact.account?.name
            ? t(':title at :account', {
                  title: contact.job_title,
                  account: contact.account.name,
              })
            : contact.job_title || contact.account?.name;

    return (
        <>
            <Head title={contact.full_name} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader
                    title={contact.full_name}
                    description={subtitle || undefined}
                >
                    <SendEmailButton
                        record={{ type: 'contact', id: contact.id }}
                        to={contact.email}
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
                    record={{ type: 'contact', id: contact.id }}
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
                                    { label: t('Email'), value: contact.email },
                                    { label: t('Phone'), value: contact.phone },
                                    {
                                        label: t('Job title'),
                                        value: contact.job_title,
                                    },
                                    {
                                        label: t('Account'),
                                        value: contact.account && (
                                            <Link
                                                href={showAccount(
                                                    contact.account.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {contact.account.name}
                                            </Link>
                                        ),
                                    },
                                    {
                                        label: t('Owner'),
                                        value: contact.owner.name,
                                    },
                                    {
                                        label: t('Added'),
                                        value: formatDate(contact.created_at),
                                    },
                                    ...customDetailItems(
                                        customFields,
                                        contact.custom_fields,
                                    ),
                                ]}
                            />
                            <RelatedService
                                supportCases={contact.support_cases}
                                contractList={contact.contracts}
                                defaults={{
                                    account_id: contact.account_id,
                                    contact_id: contact.id,
                                }}
                            />
                        </>
                    }
                />
            </div>

            <ContactFormDialog
                contact={editing ? contact : null}
                owners={owners}
                accounts={accounts}
                onClose={() => setEditing(false)}
            />
            <ConfirmDeleteDialog
                form={
                    deleting ? ContactController.destroy.form(contact.id) : null
                }
                title={t('Delete :name?', { name: contact.full_name })}
                description={t(
                    "They'll be removed from your contacts and their account.",
                )}
                onClose={() => setDeleting(false)}
            />
        </>
    );
}
