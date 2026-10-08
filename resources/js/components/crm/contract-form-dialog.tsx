import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import ContractController from '@/actions/App/Http/Controllers/ContractController';
import { CustomFieldInputs } from '@/components/crm/custom-fields';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DateField, SelectField, TextField } from '@/components/form-field';
import type { ContactOption, RecordDefaults, Contract, Option } from '@/types';
import { t } from '@/lib/i18n';

export type ContractOptions = {
    owners: Option[];
    accounts: Option[];
    contacts: ContactOption[];
    /** Quotes, with their account so the picker narrows to the chosen one. */
    quotes: ContactOption[];
    statuses: Option[];
};

export function ContractFormDialog({
    contract,
    options,
    defaults,
    onClose,
}: {
    /** Account and contact to start a new one with (from an account or contact page). */
    defaults?: RecordDefaults | null;
    contract: Contract | 'new' | null;
    options: ContractOptions;
    onClose: () => void;
}) {
    const { auth, currency } = usePage().props;
    const existing = contract !== 'new' ? contract : null;
    const [accountId, setAccountId] = useState<string | null>(
        existing
            ? String(existing.account_id)
            : defaults?.account_id
              ? String(defaults.account_id)
              : null,
    );
    const forAccount = <T extends ContactOption>(rows: T[]) =>
        rows.filter((r) => !accountId || String(r.account_id) === accountId);
    const contacts = forAccount(options.contacts);
    const quotes = forAccount(options.quotes);
    const keep = (id: number | null | undefined, rows: ContactOption[]) =>
        id && rows.some((r) => r.value === String(id)) ? String(id) : null;

    return (
        <RecordFormDialog
            open={contract !== null}
            title={
                existing
                    ? t('Edit :name', { name: existing.name })
                    : t('Add contract')
            }
            description={t(
                'An agreement for a period. The owner gets a renewal reminder and task before it ends.',
            )}
            form={
                existing
                    ? ContractController.update.form(existing.id)
                    : ContractController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Add contract')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="contract-name"
                        label={t('Name')}
                        name="name"
                        defaultValue={existing?.name}
                        error={errors.name}
                        autoComplete="off"
                        className="sm:col-span-2"
                    />
                    <SelectField
                        id="contract-account"
                        label={t('Account')}
                        name="account_id"
                        options={options.accounts}
                        placeholder={t('Choose an account')}
                        defaultValue={accountId}
                        onValueChange={setAccountId}
                        error={errors.account_id}
                    />
                    <SelectField
                        key={`contact-${accountId}`}
                        id="contract-contact"
                        label={t('Contact')}
                        name="contact_id"
                        options={contacts}
                        noneLabel={t('No contact')}
                        defaultValue={keep(
                            existing?.contact_id ?? defaults?.contact_id,
                            contacts,
                        )}
                        error={errors.contact_id}
                    />
                    <DateField
                        id="contract-start"
                        label={t('Start date')}
                        name="start_date"
                        defaultValue={existing?.start_date}
                        error={errors.start_date}
                    />
                    <DateField
                        id="contract-end"
                        label={t('End date')}
                        name="end_date"
                        defaultValue={existing?.end_date}
                        error={errors.end_date}
                    />
                    <TextField
                        id="contract-value"
                        label={t('Value (:currency)', { currency })}
                        name="value"
                        inputMode="decimal"
                        defaultValue={existing?.value ?? ''}
                        error={errors.value}
                    />
                    <SelectField
                        key={`quote-${accountId}`}
                        id="contract-quote"
                        label={t('From quote')}
                        name="quote_id"
                        options={quotes}
                        noneLabel={t('No quote')}
                        defaultValue={keep(existing?.quote_id, quotes)}
                        error={errors.quote_id}
                    />
                    <SelectField
                        id="contract-status"
                        label={t('Status')}
                        name="status"
                        options={options.statuses}
                        defaultValue={existing?.status ?? 'active'}
                        error={errors.status}
                    />
                    <TextField
                        id="contract-notice"
                        label={t('Remind (days before end)')}
                        name="notice_days"
                        inputMode="numeric"
                        defaultValue={String(existing?.notice_days ?? 30)}
                        error={errors.notice_days}
                    />
                    <TextField
                        id="contract-terms"
                        label={t('Renewal terms')}
                        name="renewal_terms"
                        multiline
                        defaultValue={existing?.renewal_terms ?? ''}
                        error={errors.renewal_terms}
                        className="sm:col-span-2"
                    />
                    <SelectField
                        id="contract-owner"
                        label={t('Owner')}
                        name="owner_id"
                        options={options.owners}
                        defaultValue={String(
                            existing?.owner_id ?? auth.user.id,
                        )}
                        error={errors.owner_id}
                    />
                    <CustomFieldInputs
                        entity="contract"
                        values={existing?.custom_fields}
                        errors={errors}
                    />
                </>
            )}
        </RecordFormDialog>
    );
}
