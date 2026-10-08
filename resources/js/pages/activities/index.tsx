import { Head } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import ActivityController from '@/actions/App/Http/Controllers/ActivityController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { ActivityFormDialog } from '@/components/crm/activity-form-dialog';
import { TasksViewToggle } from '@/components/crm/tasks-view-toggle';
import {
    ActivityDue,
    ActivityRegarding,
    ActivitySubject,
    DoneCheckbox,
} from '@/components/crm/activity-item';
import type { Column } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { ListPagination } from '@/components/list-pagination';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ListFilters } from '@/hooks/use-list-filters';
import {
    useHiddenColumns,
    useListFilters,
    useViewMode,
} from '@/hooks/use-list-filters';
import { t } from '@/lib/i18n';
import { index } from '@/routes/activities';
import type { Activity, Option, Paginated } from '@/types';

type Tab = 'overdue' | 'today' | 'upcoming' | 'unscheduled' | 'done';

type Props = {
    activities: Paginated<Activity>;
    filters: ListFilters & { tab: Tab };
    counts: Record<Tab, number>;
    owners: Option[];
    types: Option[];
};

const tabs: { value: Tab; label: string }[] = [
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'unscheduled', label: 'No date' },
    { value: 'done', label: 'Done' },
];

export default function Activities({
    activities,
    filters,
    counts,
    owners,
    types,
}: Props) {
    const list = useListFilters(index.url(), filters);
    const [hidden, toggle] = useHiddenColumns('activities');
    const [layout, setLayout] = useViewMode('activities');
    const [editing, setEditing] = useState<Activity | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Activity | null>(null);

    const columns: Column<Activity>[] = [
        {
            key: 'subject',
            header: t('Subject'),
            hideable: false,
            cell: (a) => <ActivitySubject activity={a} />,
        },
        {
            key: 'regarding',
            header: t('Regarding'),
            cell: (a) => <ActivityRegarding activity={a} />,
        },
        {
            key: 'due',
            header: t('Due'),
            cell: (a) => <ActivityDue activity={a} />,
        },
        { key: 'owner', header: t('Assigned to'), cell: (a) => a.owner?.name },
        {
            key: 'done',
            header: t('Done'),
            className: 'w-px',
            cell: (a) => <DoneCheckbox activity={a} />,
        },
    ];

    return (
        <>
            <Head title={t('My tasks')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('My tasks')}
                    description={t(
                        "Calls, meetings and tasks, soonest first. Tick one off when it's done.",
                    )}
                >
                    <TasksViewToggle value="list" />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Log activity')}
                    </Button>
                </PageHeader>

                <Tabs
                    value={filters.tab}
                    onValueChange={(tab) => list.apply({ tab })}
                >
                    <TabsList>
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="gap-2"
                            >
                                {t(tab.label)}
                                <Badge
                                    variant={
                                        tab.value === 'overdue' &&
                                        counts.overdue > 0
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    {counts[tab.value]}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <ListToolbar
                    savedViews={{
                        list: 'activities',
                        url: index.url(),
                        filters,
                    }}
                    search={filters.search}
                    searchLabel={t('Search subjects')}
                    owner={filters.owner}
                    owners={
                        owners.length > 1
                            ? [
                                  { value: 'everyone', label: t('Everyone') },
                                  ...owners,
                              ]
                            : []
                    }
                    ownerAllLabel={t('Assigned to me')}
                    onChange={list.apply}
                    columns={columns}
                    hiddenColumns={hidden}
                    onToggleColumn={toggle}
                    view={layout}
                    onViewChange={setLayout}
                />

                <DataTable
                    view={layout}
                    columns={columns}
                    hiddenColumns={hidden}
                    rows={activities.data}
                    rowKey={(a) => a.id}
                    empty={
                        filters.tab === 'overdue'
                            ? t('Nothing overdue.')
                            : filters.tab === 'today'
                              ? t('Nothing due today.')
                              : t('Nothing here.')
                    }
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
                <ListPagination page={activities} />
            </div>

            <ActivityFormDialog
                activity={editing}
                types={types}
                owners={owners}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={deleting && ActivityController.destroy.form(deleting.id)}
                title={t('Delete “:subject”?', { subject: deleting?.subject })}
                description={t('The activity will be removed.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Activities.layout = { breadcrumbs: [{ title: 'My tasks', href: index() }] };
