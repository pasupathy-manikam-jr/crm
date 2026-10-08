import { usePage } from '@inertiajs/react';
import AccountController from '@/actions/App/Http/Controllers/AccountController';
import { CustomFieldInputs } from '@/components/crm/custom-fields';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { SelectField, TextField } from '@/components/form-field';
import { t } from '@/lib/i18n';
import type { Account, Option } from '@/types';

export function AccountFormDialog({
    account,
    owners,
    onClose,
}: {
    account: Account | 'new' | null;
    owners: Option[];
    onClose: () => void;
}) {
    const { auth } = usePage().props;
    const existing = account !== 'new' ? account : null;

    return (
        <RecordFormDialog
            open={account !== null}
            title={
                existing
                    ? t('Edit :name', { name: existing.name })
                    : t('Add account')
            }
            description={t(
                'The company you sell to. Contacts and deals are linked to it.',
            )}
            form={
                existing
                    ? AccountController.update.form(existing.id)
                    : AccountController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Add account')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="account-name"
                        label={t('Company name')}
                        name="name"
                        defaultValue={existing?.name}
                        error={errors.name}
                        className="sm:col-span-2"
                        autoComplete="off"
                    />
                    <TextField
                        id="account-industry"
                        label={t('Industry')}
                        name="industry"
                        defaultValue={existing?.industry ?? ''}
                        error={errors.industry}
                    />
                    <SelectField
                        id="account-owner"
                        label={t('Owner')}
                        name="owner_id"
                        options={owners}
                        defaultValue={String(
                            existing?.owner_id ?? auth.user.id,
                        )}
                        error={errors.owner_id}
                    />
                    <TextField
                        id="account-phone"
                        label={t('Phone')}
                        name="phone"
                        type="tel"
                        defaultValue={existing?.phone ?? ''}
                        error={errors.phone}
                    />
                    <TextField
                        id="account-email"
                        label={t('Email')}
                        name="email"
                        type="email"
                        defaultValue={existing?.email ?? ''}
                        error={errors.email}
                    />
                    <TextField
                        id="account-website"
                        label={t('Website')}
                        name="website"
                        type="url"
                        placeholder="https://"
                        defaultValue={existing?.website ?? ''}
                        error={errors.website}
                        className="sm:col-span-2"
                    />
                    <TextField
                        id="account-billing"
                        label={t('Billing address')}
                        name="billing_address"
                        multiline
                        defaultValue={existing?.billing_address ?? ''}
                        error={errors.billing_address}
                    />
                    <TextField
                        id="account-shipping"
                        label={t('Shipping address')}
                        name="shipping_address"
                        multiline
                        defaultValue={existing?.shipping_address ?? ''}
                        error={errors.shipping_address}
                    />
                    <CustomFieldInputs
                        entity="account"
                        values={existing?.custom_fields}
                        errors={errors}
                    />
                </>
            )}
        </RecordFormDialog>
    );
}
