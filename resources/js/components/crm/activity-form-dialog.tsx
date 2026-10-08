import { usePage } from '@inertiajs/react';
import ActivityController from '@/actions/App/Http/Controllers/ActivityController';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DateField, SelectField, TextField } from '@/components/form-field';
import { t } from '@/lib/i18n';
import { toDateTimeInput } from '@/lib/utils';
import type { Activity, Option, Regarding } from '@/types';

export function ActivityFormDialog({
    activity,
    types,
    owners,
    regarding,
    defaultDue,
    onClose,
}: {
    /** Y-m-dTH:i a new activity starts with (from a calendar day). */
    defaultDue?: string;
    activity: Activity | 'new' | null;
    types: Option[];
    owners: Option[];
    /** Links a new activity to the record whose page it was logged from. */
    regarding?: Regarding;
    onClose: () => void;
}) {
    const { auth } = usePage().props;
    const existing = activity !== 'new' ? activity : null;
    const link =
        existing?.regarding_type && existing.regarding_id
            ? { type: existing.regarding_type, id: existing.regarding_id }
            : regarding;

    return (
        <RecordFormDialog
            open={activity !== null}
            title={existing ? t('Edit activity') : t('Log activity')}
            description={t(
                'A call, meeting or task, with who does it and when.',
            )}
            form={
                existing
                    ? ActivityController.update.form(existing.id)
                    : ActivityController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Log activity')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    {link && (
                        <>
                            <input
                                type="hidden"
                                name="regarding_type"
                                value={link.type}
                            />
                            <input
                                type="hidden"
                                name="regarding_id"
                                value={link.id}
                            />
                        </>
                    )}
                    <SelectField
                        id="activity-type"
                        label={t('Type')}
                        name="type"
                        options={types}
                        defaultValue={existing?.type ?? 'task'}
                        error={errors.type}
                    />
                    <SelectField
                        id="activity-owner"
                        label={t('Assigned to')}
                        name="owner_id"
                        options={owners}
                        defaultValue={String(
                            existing?.owner_id ?? auth.user.id,
                        )}
                        error={errors.owner_id}
                    />
                    <TextField
                        id="activity-subject"
                        label={t('Subject')}
                        name="subject"
                        defaultValue={existing?.subject}
                        error={errors.subject}
                        autoComplete="off"
                        className="sm:col-span-2"
                    />
                    <DateField
                        id="activity-due"
                        label={t('Due')}
                        name="due_at"
                        withTime
                        defaultValue={
                            existing
                                ? toDateTimeInput(existing.due_at)
                                : defaultDue
                        }
                        error={errors.due_at}
                        className="sm:col-span-2"
                    />
                    <TextField
                        id="activity-notes"
                        label={t('Notes')}
                        name="notes"
                        multiline
                        defaultValue={existing?.notes ?? ''}
                        error={errors.notes}
                        className="sm:col-span-2"
                    />
                </>
            )}
        </RecordFormDialog>
    );
}
