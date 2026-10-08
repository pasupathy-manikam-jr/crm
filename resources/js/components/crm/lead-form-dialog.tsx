import { usePage } from '@inertiajs/react';
import LeadController from '@/actions/App/Http/Controllers/LeadController';
import { CustomFieldInputs } from '@/components/crm/custom-fields';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { SelectField, TextField } from '@/components/form-field';
import { t } from '@/lib/i18n';
import type { Lead, Option } from '@/types';

export type LeadOptions = {
    owners: Option[];
    statuses: Option[];
    sources: Option[];
};

export function LeadFormDialog({
    lead,
    options,
    onClose,
}: {
    lead: Lead | 'new' | null;
    options: LeadOptions;
    onClose: () => void;
}) {
    const { auth } = usePage().props;
    const existing = lead !== 'new' ? lead : null;

    return (
        <RecordFormDialog
            open={lead !== null}
            title={
                existing
                    ? t('Edit :name', { name: existing.full_name })
                    : t('Add lead')
            }
            description={t(
                'Someone who may buy. Once qualified, convert them into an account, contact and deal.',
            )}
            form={
                existing
                    ? LeadController.update.form(existing.id)
                    : LeadController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Add lead')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="lead-first"
                        label={t('First name')}
                        name="first_name"
                        defaultValue={existing?.first_name}
                        error={errors.first_name}
                        autoComplete="off"
                    />
                    <TextField
                        id="lead-last"
                        label={t('Last name')}
                        name="last_name"
                        defaultValue={existing?.last_name}
                        error={errors.last_name}
                        autoComplete="off"
                    />
                    <TextField
                        id="lead-company"
                        label={t('Company')}
                        name="company"
                        defaultValue={existing?.company ?? ''}
                        error={errors.company}
                    />
                    <TextField
                        id="lead-title"
                        label={t('Job title')}
                        name="job_title"
                        defaultValue={existing?.job_title ?? ''}
                        error={errors.job_title}
                    />
                    <TextField
                        id="lead-email"
                        label={t('Email')}
                        name="email"
                        type="email"
                        defaultValue={existing?.email ?? ''}
                        error={errors.email}
                    />
                    <TextField
                        id="lead-phone"
                        label={t('Phone')}
                        name="phone"
                        type="tel"
                        defaultValue={existing?.phone ?? ''}
                        error={errors.phone}
                    />
                    <SelectField
                        id="lead-status"
                        label={t('Status')}
                        name="status"
                        options={
                            existing?.status === 'converted'
                                ? options.statuses.filter(
                                      (s) => s.value === 'converted',
                                  )
                                : options.statuses.filter(
                                      (s) => s.value !== 'converted',
                                  )
                        }
                        defaultValue={existing?.status ?? 'new'}
                        error={errors.status}
                    />
                    <SelectField
                        id="lead-source"
                        label={t('Source')}
                        name="source"
                        options={options.sources}
                        noneLabel={t('Unknown')}
                        defaultValue={existing?.source}
                        error={errors.source}
                    />
                    <SelectField
                        id="lead-owner"
                        label={t('Owner')}
                        name="owner_id"
                        options={options.owners}
                        defaultValue={String(
                            existing?.owner_id ?? auth.user.id,
                        )}
                        error={errors.owner_id}
                        className="sm:col-span-2"
                    />
                    <CustomFieldInputs
                        entity="lead"
                        values={existing?.custom_fields}
                        errors={errors}
                    />
                </>
            )}
        </RecordFormDialog>
    );
}
