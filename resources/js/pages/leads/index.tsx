import { Head, Link } from '@inertiajs/react';
import { index as duplicatesIndex } from '@/routes/duplicates';
import {
    ArrowsClockwiseIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
    CopyIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import LeadController from '@/actions/App/Http/Controllers/LeadController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CsvActions } from '@/components/crm/csv-actions';
import type { CsvField } from '@/components/crm/import-dialog';
import { ConvertLeadDialog } from '@/components/crm/convert-lead-dialog';
import type { LeadOptions } from '@/components/crm/lead-form-dialog';
import { LeadFormDialog } from '@/components/crm/lead-form-dialog';
import { LeadStatusBadge } from '@/components/crm/lead-status-badge';
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
import { formatDate } from '@/lib/utils';
import { index, show } from '@/routes/leads';
import type { Lead, Option, Paginated } from '@/types';
import { t } from '@/lib/i18n';

type Props = LeadOptions & {
    csvFields: CsvField[];
    leads: Paginated<Lead>;
    filters: ListFilters;
    /** For the Convert dialog. */
    accounts: Option[];
    stages: { id: number; name: string }[];
};

export default function Leads({
    csvFields,
    leads,
    filters,
    owners,
    statuses,
    sources,
    accounts,
    stages,
}: Props) {
    const list = useListFilters(index.url(), filters);
    const custom = useCustomFields('lead');
    const [hidden, toggle] = useHiddenColumns('leads');
    const [layout, setLayout] = useViewMode('leads');
    const [editing, setEditing] = useState<Lead | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Lead | null>(null);
    const [converting, setConverting] = useState<Lead | null>(null);
    const label = (
        options: { value: string; label: string }[],
        value: string | null,
    ) => options.find((o) => o.value === value)?.label;

    const columns: Column<Lead>[] = [
        {
            key: 'name',
            header: t('Name'),
            sortKey: 'last_name',
            hideable: false,
            cell: (l) => (
                <Link
                    href={show(l.id)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                >
                    {l.full_name}
                </Link>
            ),
        },
        {
            key: 'company',
            header: t('Company'),
            sortKey: 'company',
            cell: (l) => l.company,
        },
        {
            key: 'status',
            header: t('Status'),
            sortKey: 'status',
            cell: (l) => (
                <LeadStatusBadge status={l.status} statuses={statuses} />
            ),
        },
        {
            key: 'source',
            header: t('Source'),
            cell: (l) => label(sources, l.source),
        },
        { key: 'email', header: t('Email'), cell: (l) => l.email },
        {
            key: 'phone',
            header: t('Phone'),
            className: 'font-mono tabular-nums',
            cell: (l) => l.phone,
        },
        { key: 'owner', header: t('Owner'), cell: (l) => l.owner.name },
        {
            key: 'created',
            header: t('Added'),
            className: 'font-mono tabular-nums',
            sortKey: 'created_at',
            cell: (l) => formatDate(l.created_at),
        },
        {
            key: 'convert',
            header: <span className="sr-only">{t('Convert')}</span>,
            hideable: false,
            className: 'w-px text-right',
            cell: (l) =>
                !l.converted_at && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConverting(l)}
                        aria-label={t('Convert :name', { name: l.full_name })}
                    >
                        <ArrowsClockwiseIcon data-icon="inline-start" />
                        {t('Convert')}
                    </Button>
                ),
        },
    ];
    const cols = [...columns, ...customColumns<Lead>(custom)];

    return (
        <>
            <Head title={t('Leads')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Leads')}
                    description={t(
                        'People who may buy, before they become customers.',
                    )}
                >
                    <Button variant="outline" asChild>
                        <Link href={duplicatesIndex('leads')}>
                            <CopyIcon data-icon="inline-start" />
                            {t('Find duplicates')}
                        </Link>
                    </Button>
                    <CsvActions
                        type="leads"
                        noun={t('leads')}
                        fields={csvFields}
                        filters={filters}
                    />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add lead')}
                    </Button>
                </PageHeader>

                <ListToolbar
                    savedViews={{ list: 'leads', url: index.url(), filters }}
                    view={layout}
                    onViewChange={setLayout}
                    search={filters.search}
                    searchLabel={t('Search leads')}
                    owner={filters.owner}
                    owners={owners}
                    onChange={list.apply}
                    columns={cols}
                    hiddenColumns={hidden}
                    onToggleColumn={toggle}
                >
                    <FilterSelect
                        label={t('Status')}
                        value={filters.status}
                        allLabel={t('All statuses')}
                        options={statuses}
                        onChange={(status) => list.apply({ status })}
                    />
                    <CustomFieldFilters
                        entity="lead"
                        filters={filters}
                        onChange={list.apply}
                    />
                </ListToolbar>

                <DataTable
                    view={layout}
                    columns={cols}
                    hiddenColumns={hidden}
                    rows={leads.data}
                    rowKey={(l) => l.id}
                    sort={list.sort}
                    onSort={list.sortBy}
                    empty={
                        filters.search || filters.status
                            ? t('No leads match these filters.')
                            : t('No leads yet. Add your first one.')
                    }
                    actions={(l) => (
                        <>
                            {!l.converted_at && (
                                <DropdownMenuItem
                                    onSelect={() => setConverting(l)}
                                >
                                    <ArrowsClockwiseIcon />
                                    {t('Convert')}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => setEditing(l)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(l)}
                            >
                                <TrashIcon />
                                {t('Delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                />
                <ListPagination page={leads} />
            </div>

            <LeadFormDialog
                lead={editing}
                options={{ owners, statuses, sources }}
                onClose={() => setEditing(null)}
            />
            {converting && (
                <ConvertLeadDialog
                    key={converting.id}
                    lead={converting}
                    open
                    accounts={accounts}
                    stages={stages}
                    onClose={() => setConverting(null)}
                />
            )}
            <ConfirmDeleteDialog
                form={deleting && LeadController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.full_name })}
                description={t('The lead will be removed from your list.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Leads.layout = { breadcrumbs: [{ title: 'Leads', href: index() }] };
