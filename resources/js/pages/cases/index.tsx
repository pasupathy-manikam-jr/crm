import { Head, Link } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import SupportCaseController from '@/actions/App/Http/Controllers/SupportCaseController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
    CasePriorityBadge,
    CaseStatusBadge,
    SlaBadge,
} from '@/components/crm/case-badges';
import type { CaseOptions } from '@/components/crm/case-form-dialog';
import { CaseFormDialog } from '@/components/crm/case-form-dialog';
import {
    CustomFieldFilters,
    customColumns,
    useCustomFields,
} from '@/components/crm/custom-fields';
import type { Column } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterSelect } from '@/components/form-field';
import { ListPagination } from '@/components/list-pagination';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { ListFilters } from '@/hooks/use-list-filters';
import {
    useHiddenColumns,
    useListFilters,
    useViewMode,
} from '@/hooks/use-list-filters';
import { formatDue } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { index, show } from '@/routes/cases';
import type { Paginated, RecordDefaults, SupportCase } from '@/types';
import { t } from '@/lib/i18n';

type Props = CaseOptions & {
    prefill: RecordDefaults | null;
    cases: Paginated<SupportCase>;
    filters: ListFilters;
};

export default function Cases({ cases, filters, prefill, ...options }: Props) {
    const list = useListFilters(index.url(), filters);
    const custom = useCustomFields('case');
    const [hidden, toggle] = useHiddenColumns('cases');
    const [layout, setLayout] = useViewMode('cases');
    const [editing, setEditing] = useState<SupportCase | 'new' | null>(
        prefill ? 'new' : null,
    );
    const [deleting, setDeleting] = useState<SupportCase | null>(null);

    const columns: Column<SupportCase>[] = [
        {
            key: 'number',
            header: t('Case'),
            sortKey: 'number',
            hideable: false,
            className: 'font-mono',
            cell: (c) => (
                <Link
                    href={show(c.id)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                >
                    {c.number}
                </Link>
            ),
        },
        {
            key: 'subject',
            header: t('Subject'),
            sortKey: 'subject',
            cell: (c) => (
                <Link href={show(c.id)} className="hover:underline">
                    {c.subject}
                </Link>
            ),
        },
        {
            key: 'account',
            header: t('Account'),
            cell: (c) =>
                c.account && (
                    <Link
                        href={showAccount(c.account.id)}
                        className="hover:underline"
                    >
                        {c.account.name}
                    </Link>
                ),
        },
        {
            key: 'priority',
            header: t('Priority'),
            sortKey: 'priority',
            cell: (c) => <CasePriorityBadge priority={c.priority} />,
        },
        {
            key: 'status',
            header: t('Status'),
            sortKey: 'status',
            cell: (c) => <CaseStatusBadge status={c.status} />,
        },
        {
            key: 'sla',
            header: t('SLA'),
            sortKey: 'sla_due_at',
            cell: (c) => (
                <span className="flex flex-col items-start gap-0.5">
                    <SlaBadge supportCase={c} />
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatDue(c.sla_due_at)}
                    </span>
                </span>
            ),
        },
        { key: 'owner', header: t('Owner'), cell: (c) => c.owner.name },
    ];
    const cols = [...columns, ...customColumns<SupportCase>(custom)];

    return (
        <>
            <Head title={t('Cases')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Cases')}
                    description={t(
                        'Customer problems, soonest SLA deadline first.',
                    )}
                >
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Open case')}
                    </Button>
                </PageHeader>

                <ListToolbar
                    savedViews={{ list: 'cases', url: index.url(), filters }}
                    view={layout}
                    onViewChange={setLayout}
                    search={filters.search}
                    searchLabel={t('Search cases')}
                    owner={filters.owner}
                    owners={options.owners}
                    onChange={list.apply}
                    columns={cols}
                    hiddenColumns={hidden}
                    onToggleColumn={toggle}
                >
                    <FilterSelect
                        label={t('Status')}
                        value={filters.status}
                        allLabel={t('Unresolved')}
                        options={[
                            { value: 'breached', label: t('Past SLA') },
                            ...options.statuses,
                            { value: 'any', label: t('All cases') },
                        ]}
                        onChange={(status) => list.apply({ status })}
                    />
                    <FilterSelect
                        label={t('Priority')}
                        value={filters.priority}
                        allLabel={t('All priorities')}
                        options={options.priorities}
                        onChange={(priority) => list.apply({ priority })}
                    />
                    <CustomFieldFilters
                        entity="case"
                        filters={filters}
                        onChange={list.apply}
                    />
                </ListToolbar>

                <DataTable
                    view={layout}
                    columns={cols}
                    hiddenColumns={hidden}
                    rows={cases.data}
                    rowKey={(c) => c.id}
                    sort={list.sort}
                    onSort={list.sortBy}
                    empty={
                        filters.search || filters.status || filters.priority
                            ? t('No cases match these filters.')
                            : t('No open cases. All quiet.')
                    }
                    actions={(c) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEditing(c)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(c)}
                            >
                                <TrashIcon />
                                {t('Delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                />
                <ListPagination page={cases} />
            </div>

            <CaseFormDialog
                key={editing === 'new' ? 'new' : (editing?.id ?? 'closed')}
                supportCase={editing}
                options={options}
                defaults={prefill}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={
                    deleting && SupportCaseController.destroy.form(deleting.id)
                }
                title={t('Delete :name?', { name: deleting?.number })}
                description={t('The case will be removed from your list.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Cases.layout = { breadcrumbs: [{ title: 'Cases', href: index() }] };
