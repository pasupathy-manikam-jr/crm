import { Head } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import HolidayController from '@/actions/App/Http/Controllers/HolidayController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DataTable } from '@/components/data-table';
import { DateField, TextField } from '@/components/form-field';
import { ViewToggle } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useViewMode } from '@/hooks/use-list-filters';
import { formatDate } from '@/lib/utils';
import { index } from '@/routes/holidays';
import { intlLocale, t } from '@/lib/i18n';

type HolidayRow = { id: number; date: string; name: string };
type BusinessHours = {
    enabled: boolean;
    days: number[];
    start: string;
    end: string;
};

export default function Holidays({
    holidays,
    businessHours,
}: {
    holidays: HolidayRow[];
    businessHours: BusinessHours;
}) {
    const [editing, setEditing] = useState<HolidayRow | 'new' | null>(null);
    const [deleting, setDeleting] = useState<HolidayRow | null>(null);
    const [layout, setLayout] = useViewMode('holidays');
    const existing = editing !== 'new' ? editing : null;
    const today = new Date().toISOString().slice(0, 10);
    const weekday = new Intl.DateTimeFormat(intlLocale(), { weekday: 'short' });
    /** 1 = Monday … 7 = Sunday (1 Jan 2024 was a Monday). */
    const dayName = (day: number) => weekday.format(new Date(2024, 0, day));

    return (
        <>
            <Head title={t('Holidays')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Holidays')}
                    description={
                        businessHours.enabled
                            ? t(
                                  "Case SLAs count working time: :days, :start–:end, skipping these days. Hours are set in the server's .env.",
                                  {
                                      days: businessHours.days
                                          .map(dayName)
                                          .join(', '),
                                      start: businessHours.start,
                                      end: businessHours.end,
                                  },
                              )
                            : t(
                                  'Case SLAs currently count every hour (CRM_SLA_BUSINESS_HOURS=false), so holidays are not skipped.',
                              )
                    }
                >
                    <ViewToggle view={layout} onChange={setLayout} />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add holiday')}
                    </Button>
                </PageHeader>

                <DataTable
                    view={layout}
                    columns={[
                        {
                            key: 'date',
                            header: t('Date'),
                            className: 'font-mono tabular-nums',
                            cell: (h) => (
                                <span
                                    className={
                                        h.date < today
                                            ? 'text-muted-foreground'
                                            : undefined
                                    }
                                >
                                    {formatDate(h.date)}
                                </span>
                            ),
                        },
                        {
                            key: 'name',
                            header: t('Holiday'),
                            cell: (h) => (
                                <span className="font-medium">{h.name}</span>
                            ),
                        },
                    ]}
                    rows={holidays}
                    rowKey={(h) => h.id}
                    empty={t(
                        'No holidays yet. Add public holidays and company days off so SLA deadlines skip them.',
                    )}
                    actions={(h) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEditing(h)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(h)}
                            >
                                <TrashIcon />
                                {t('Delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                />
            </div>

            <RecordFormDialog
                open={editing !== null}
                title={
                    existing
                        ? t('Edit :name', { name: existing.name })
                        : t('Add holiday')
                }
                description={t(
                    "A day the SLA clock doesn't run. Deadlines already set keep their date.",
                )}
                form={
                    existing
                        ? HolidayController.update.form(existing.id)
                        : HolidayController.store.form()
                }
                formKey={existing?.id ?? 'new'}
                submitLabel={existing ? t('Save') : t('Add holiday')}
                onClose={() => setEditing(null)}
            >
                {(errors) => (
                    <>
                        <DateField
                            id="holiday-date"
                            label={t('Date')}
                            name="date"
                            defaultValue={existing?.date}
                            error={errors.date}
                        />
                        <TextField
                            id="holiday-name"
                            label={t('Name')}
                            name="name"
                            defaultValue={existing?.name}
                            placeholder="Hari Merdeka"
                            error={errors.name}
                            autoComplete="off"
                        />
                    </>
                )}
            </RecordFormDialog>

            <ConfirmDeleteDialog
                form={deleting && HolidayController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t('New SLA deadlines will count this day again.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Holidays.layout = {
    breadcrumbs: [{ title: 'Holidays', href: index() }],
};
