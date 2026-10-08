import { Head, Link, usePage } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import ContractController from '@/actions/App/Http/Controllers/ContractController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
    ContractStatusBadge,
    EndsInBadge,
} from '@/components/crm/contract-badges';
import type { ContractOptions } from '@/components/crm/contract-form-dialog';
import { ContractFormDialog } from '@/components/crm/contract-form-dialog';
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
import { t } from '@/lib/i18n';
import { formatDate, formatMoney } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { index, show } from '@/routes/contracts';
import type { Contract, Paginated, RecordDefaults } from '@/types';

type Props = ContractOptions & {
    prefill: RecordDefaults | null;
    contracts: Paginated<Contract>;
    filters: ListFilters;
};

export default function Contracts({
    contracts,
    filters,
    prefill,
    ...options
}: Props) {
    const { currency } = usePage().props;
    const list = useListFilters(index.url(), filters);
    const custom = useCustomFields('contract');
    const [hidden, toggle] = useHiddenColumns('contracts');
    const [layout, setLayout] = useViewMode('contracts');
    const [editing, setEditing] = useState<Contract | 'new' | null>(
        prefill ? 'new' : null,
    );
    const [deleting, setDeleting] = useState<Contract | null>(null);

    const columns: Column<Contract>[] = [
        {
            key: 'name',
            header: t('Contract'),
            sortKey: 'name',
            hideable: false,
            cell: (c) => (
                <Link
                    href={show(c.id)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                >
                    {c.name}
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
            key: 'status',
            header: t('Status'),
            sortKey: 'status',
            cell: (c) => <ContractStatusBadge status={c.status} />,
        },
        {
            key: 'start',
            header: t('Start'),
            sortKey: 'start_date',
            className: 'font-mono tabular-nums',
            cell: (c) => formatDate(c.start_date),
        },
        {
            key: 'end',
            header: t('End'),
            sortKey: 'end_date',
            cell: (c) => (
                <span className="flex flex-col items-start gap-0.5">
                    <span className="font-mono tabular-nums">
                        {formatDate(c.end_date)}
                    </span>
                    <EndsInBadge contract={c} />
                </span>
            ),
        },
        {
            key: 'value',
            header: t('Value'),
            sortKey: 'value',
            className: 'text-right font-mono tabular-nums',
            cell: (c) => formatMoney(c.value, currency),
        },
        { key: 'owner', header: t('Owner'), cell: (c) => c.owner.name },
    ];
    const cols = [...columns, ...customColumns<Contract>(custom)];

    return (
        <>
            <Head title={t('Contracts')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Contracts')}
                    description={t(
                        'Agreements with customers, soonest ending first. Owners are reminded before each one ends.',
                    )}
                >
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add contract')}
                    </Button>
                </PageHeader>

                <ListToolbar
                    savedViews={{
                        list: 'contracts',
                        url: index.url(),
                        filters,
                    }}
                    view={layout}
                    onViewChange={setLayout}
                    search={filters.search}
                    searchLabel={t('Search contracts')}
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
                        allLabel={t('All statuses')}
                        options={[
                            {
                                value: 'expiring',
                                label: t('Ending in 60 days'),
                            },
                            ...options.statuses,
                        ]}
                        onChange={(status) => list.apply({ status })}
                    />
                    <CustomFieldFilters
                        entity="contract"
                        filters={filters}
                        onChange={list.apply}
                    />
                </ListToolbar>

                <DataTable
                    view={layout}
                    columns={cols}
                    hiddenColumns={hidden}
                    rows={contracts.data}
                    rowKey={(c) => c.id}
                    sort={list.sort}
                    onSort={list.sortBy}
                    empty={
                        filters.search || filters.status
                            ? t('No contracts match these filters.')
                            : t('No contracts yet. Add your first one.')
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
                <ListPagination page={contracts} />
            </div>

            <ContractFormDialog
                key={editing === 'new' ? 'new' : (editing?.id ?? 'closed')}
                contract={editing}
                options={options}
                defaults={prefill}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={deleting && ContractController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t('The contract will be removed from your list.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Contracts.layout = { breadcrumbs: [{ title: 'Contracts', href: index() }] };
