import { usePage } from '@inertiajs/react';
import ContactController from '@/actions/App/Http/Controllers/ContactController';
import { CustomFieldInputs } from '@/components/crm/custom-fields';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { SelectField, TextField } from '@/components/form-field';
import type { Contact, Option } from '@/types';
import { t } from '@/lib/i18n';

export function ContactFormDialog({
    contact,
    owners,
    accounts,
    defaultAccountId,
    onClose,
}: {
    contact: Contact | 'new' | null;
    owners: Option[];
    accounts: Option[];
    /** Pre-selects the account when adding from an account's page. */
    defaultAccountId?: number;
    onClose: () => void;
}) {
    const { auth } = usePage().props;
    const existing = contact !== 'new' ? contact : null;
    const accountId = existing ? existing.account_id : defaultAccountId;

    return (
        <RecordFormDialog
            open={contact !== null}
            title={
                existing
                    ? t('Edit :name', { name: existing.full_name })
                    : t('Add contact')
            }
            description={t(
                'A person you deal with, usually at one of your accounts.',
            )}
            form={
                existing
                    ? ContactController.update.form(existing.id)
                    : ContactController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Add contact')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="contact-first"
                        label={t('First name')}
                        name="first_name"
                        defaultValue={existing?.first_name}
                        error={errors.first_name}
                        autoComplete="off"
                    />
                    <TextField
                        id="contact-last"
                        label={t('Last name')}
                        name="last_name"
                        defaultValue={existing?.last_name}
                        error={errors.last_name}
                        autoComplete="off"
                    />
                    <TextField
                        id="contact-title"
                        label={t('Job title')}
                        name="job_title"
                        defaultValue={existing?.job_title ?? ''}
                        error={errors.job_title}
                    />
                    <SelectField
                        id="contact-account"
                        label={t('Account')}
                        name="account_id"
                        options={accounts}
                        noneLabel={t('No account')}
                        defaultValue={accountId ? String(accountId) : null}
                        error={errors.account_id}
                    />
                    <TextField
                        id="contact-email"
                        label={t('Email')}
                        name="email"
                        type="email"
                        defaultValue={existing?.email ?? ''}
                        error={errors.email}
                    />
                    <TextField
                        id="contact-phone"
                        label={t('Phone')}
                        name="phone"
                        type="tel"
                        defaultValue={existing?.phone ?? ''}
                        error={errors.phone}
                    />
                    <SelectField
                        id="contact-owner"
                        label={t('Owner')}
                        name="owner_id"
                        options={owners}
                        defaultValue={String(
                            existing?.owner_id ?? auth.user.id,
                        )}
                        error={errors.owner_id}
                    />
                    <CustomFieldInputs
                        entity="contact"
                        values={existing?.custom_fields}
                        errors={errors}
                    />
                </>
            )}
        </RecordFormDialog>
    );
}
