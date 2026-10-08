import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import DealController from '@/actions/App/Http/Controllers/DealController';
import { CustomFieldInputs } from '@/components/crm/custom-fields';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DateField, SelectField, TextField } from '@/components/form-field';
import type { ContactOption, Deal, Option, Stage } from '@/types';
import { t } from '@/lib/i18n';

export type DealOptions = {
    stages: Stage[];
    owners: Option[];
    accounts: Option[];
    contacts: ContactOption[];
};

export function DealFormDialog({
    deal,
    options,
    defaultAccountId,
    onClose,
}: {
    deal: Deal | 'new' | null;
    options: DealOptions;
    /** Pre-selects the account when adding from an account's page. */
    defaultAccountId?: number;
    onClose: () => void;
}) {
    const { auth, currency } = usePage().props;
    const existing = deal !== 'new' ? deal : null;
    const [accountId, setAccountId] = useState<string>(
        String(existing?.account_id ?? defaultAccountId ?? 'none'),
    );
    const contacts = options.contacts.filter(
        (c) => accountId === 'none' || String(c.account_id) === accountId,
    );

    return (
        <RecordFormDialog
            open={deal !== null}
            title={
                existing
                    ? t('Edit :name', { name: existing.name })
                    : t('Add deal')
            }
            description={t(
                'Money that may come in. Its stage sets the win probability.',
            )}
            form={
                existing
                    ? DealController.update.form(existing.id)
                    : DealController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Add deal')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="deal-name"
                        label={t('Deal name')}
                        name="name"
                        defaultValue={existing?.name}
                        error={errors.name}
                        autoComplete="off"
                        className="sm:col-span-2"
                    />
                    <SelectField
                        id="deal-account"
                        label={t('Account')}
                        name="account_id"
                        options={options.accounts}
                        noneLabel={t('No account')}
                        defaultValue={accountId === 'none' ? null : accountId}
                        onValueChange={setAccountId}
                        error={errors.account_id}
                    />
                    <SelectField
                        key={accountId}
                        id="deal-contact"
                        label={t('Contact')}
                        name="contact_id"
                        options={contacts}
                        noneLabel={t('No contact')}
                        defaultValue={
                            existing?.contact_id &&
                            contacts.some(
                                (c) => c.value === String(existing.contact_id),
                            )
                                ? String(existing.contact_id)
                                : null
                        }
                        error={errors.contact_id}
                    />
                    <TextField
                        id="deal-amount"
                        label={t('Amount (:currency)', { currency })}
                        name="amount"
                        inputMode="decimal"
                        defaultValue={existing?.amount ?? ''}
                        error={errors.amount}
                    />
                    <SelectField
                        id="deal-stage"
                        label={t('Stage')}
                        name="stage_id"
                        options={options.stages.map((s) => ({
                            value: String(s.id),
                            label: `${s.name} · ${s.probability}%`,
                        }))}
                        defaultValue={String(
                            existing?.stage_id ?? options.stages[0]?.id ?? '',
                        )}
                        error={errors.stage_id}
                    />
                    <DateField
                        id="deal-close"
                        label={t('Expected close')}
                        name="expected_close_date"
                        defaultValue={existing?.expected_close_date}
                        error={errors.expected_close_date}
                    />
                    <SelectField
                        id="deal-owner"
                        label={t('Owner')}
                        name="owner_id"
                        options={options.owners}
                        defaultValue={String(
                            existing?.owner_id ?? auth.user.id,
                        )}
                        error={errors.owner_id}
                    />
                    <CustomFieldInputs
                        entity="deal"
                        values={existing?.custom_fields}
                        errors={errors}
                    />
                </>
            )}
        </RecordFormDialog>
    );
}
