import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import ActivityController from '@/actions/App/Http/Controllers/ActivityController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { ActivityFormDialog } from '@/components/crm/activity-form-dialog';
import {
    ActivityDue,
    ActivitySubject,
    DoneCheckbox,
} from '@/components/crm/activity-item';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { Activity, Option, Regarding } from '@/types';
import { t } from '@/lib/i18n';

/** A record page's calls, meetings and tasks, with logging and ticking off in place. */
export function ActivityPanel({
    activities,
    types,
    owners,
    regarding,
}: {
    activities: Activity[];
    types: Option[];
    owners: Option[];
    regarding: Regarding;
}) {
    const [editing, setEditing] = useState<Activity | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Activity | null>(null);
    const open = activities.filter((a) => !a.done_at).length;

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">
                    {t('Activities')}{' '}
                    <span className="text-muted-foreground">
                        {t(':count open', { count: open })}
                    </span>
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing('new')}
                >
                    <PlusIcon data-icon="inline-start" />
                    {t('Log activity')}
                </Button>
            </div>
            <DataTable
                columns={[
                    {
                        key: 'done',
                        header: <span className="sr-only">{t('Done')}</span>,
                        hideable: false,
                        className: 'w-px',
                        cell: (a) => <DoneCheckbox activity={a} />,
                    },
                    {
                        key: 'subject',
                        header: t('Subject'),
                        cell: (a) => <ActivitySubject activity={a} />,
                    },
                    {
                        key: 'due',
                        header: t('Due'),
                        cell: (a) => <ActivityDue activity={a} />,
                    },
                    {
                        key: 'owner',
                        header: t('Assigned to'),
                        cell: (a) => a.owner?.name,
                    },
                ]}
                rows={activities}
                rowKey={(a) => a.id}
                empty={t('No calls, meetings or tasks yet.')}
                actions={(a) => (
                    <>
                        <DropdownMenuItem onSelect={() => setEditing(a)}>
                            <PencilSimpleIcon />
                            {t('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(a)}
                        >
                            <TrashIcon />
                            {t('Delete')}
                        </DropdownMenuItem>
                    </>
                )}
            />

            <ActivityFormDialog
                activity={editing}
                types={types}
                owners={owners}
                regarding={regarding}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={deleting && ActivityController.destroy.form(deleting.id)}
                title={t('Delete “:subject”?', { subject: deleting?.subject })}
                description={t('The activity will be removed.')}
                onClose={() => setDeleting(null)}
            />
        </section>
    );
}
