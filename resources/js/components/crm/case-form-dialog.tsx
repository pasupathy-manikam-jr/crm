import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import SupportCaseController from '@/actions/App/Http/Controllers/SupportCaseController';
import { CustomFieldInputs } from '@/components/crm/custom-fields';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { SelectField, TextField } from '@/components/form-field';
import type {
    ContactOption,
    RecordDefaults,
    Option,
    SupportCase,
} from '@/types';
import { t } from '@/lib/i18n';

export type CaseOptions = {
    owners: Option[];
    accounts: Option[];
    contacts: ContactOption[];
    statuses: Option[];
    priorities: Option[];
};

export function CaseFormDialog({
    supportCase,
    options,
    defaults,
    onClose,
}: {
    /** Account and contact to start a new one with (from an account or contact page). */
    defaults?: RecordDefaults | null;
    supportCase: SupportCase | 'new' | null;
    options: CaseOptions;
    onClose: () => void;
}) {
    const { auth } = usePage().props;
    const existing = supportCase !== 'new' ? supportCase : null;
    const [accountId, setAccountId] = useState<string>(
        String(existing?.account_id ?? defaults?.account_id ?? 'none'),
    );
    const contacts = options.contacts.filter(
        (c) => accountId === 'none' || String(c.account_id) === accountId,
    );
    const keep = (id: number | null | undefined, rows: ContactOption[]) =>
        id && rows.some((r) => r.value === String(id)) ? String(id) : null;

    return (
        <RecordFormDialog
            open={supportCase !== null}
            title={
                existing
                    ? t('Edit :name', { name: existing.number })
                    : t('Open case')
            }
            description={t(
                'A customer problem to solve. Its priority sets the SLA in working time: urgent 4 hours, high 1 day, normal 3 days, low 5 days (holidays skipped).',
            )}
            form={
                existing
                    ? SupportCaseController.update.form(existing.id)
                    : SupportCaseController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Open case')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="case-subject"
                        label={t('Subject')}
                        name="subject"
                        defaultValue={existing?.subject}
                        error={errors.subject}
                        autoComplete="off"
                        className="sm:col-span-2"
                    />
                    <TextField
                        id="case-description"
                        label={t('Description')}
                        name="description"
                        multiline
                        defaultValue={existing?.description ?? ''}
                        error={errors.description}
                        className="sm:col-span-2"
                    />
                    <SelectField
                        id="case-account"
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
                        id="case-contact"
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
                    <SelectField
                        id="case-priority"
                        label={t('Priority')}
                        name="priority"
                        options={options.priorities}
                        defaultValue={existing?.priority ?? 'normal'}
                        error={errors.priority}
                    />
                    <SelectField
                        id="case-status"
                        label={t('Status')}
                        name="status"
                        options={options.statuses}
                        defaultValue={existing?.status ?? 'open'}
                        error={errors.status}
                    />
                    <SelectField
                        id="case-owner"
                        label={t('Owner')}
                        name="owner_id"
                        options={options.owners}
                        defaultValue={String(
                            existing?.owner_id ?? auth.user.id,
                        )}
                        error={errors.owner_id}
                    />
                    <CustomFieldInputs
                        entity="case"
                        values={existing?.custom_fields}
                        errors={errors}
                    />
                </>
            )}
        </RecordFormDialog>
    );
}
