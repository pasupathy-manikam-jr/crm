import { Head, Link } from '@inertiajs/react';
import { index as duplicatesIndex } from '@/routes/duplicates';
import {
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
    CopyIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import AccountController from '@/actions/App/Http/Controllers/AccountController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CsvActions } from '@/components/crm/csv-actions';
import type { CsvField } from '@/components/crm/import-dialog';
import { AccountFormDialog } from '@/components/crm/account-form-dialog';
import {
    CustomFieldFilters,
    customColumns,
    useCustomFields,
} from '@/components/crm/custom-fields';
import type { Column } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
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
import { index, show } from '@/routes/accounts';
import type { Account, Option, Paginated } from '@/types';
import { t } from '@/lib/i18n';

type Props = {
    csvFields: CsvField[];
    accounts: Paginated<Account>;
    filters: ListFilters;
    owners: Option[];
};

const columns = (): Column<Account>[] => [
    {
        key: 'name',
        header: t('Account'),
        sortKey: 'name',
        hideable: false,
        cell: (a) => (
            <Link
                href={show(a.id)}
                className="font-medium text-primary underline-offset-4 hover:underline"
            >
                {a.name}
            </Link>
        ),
    },
    {
        key: 'industry',
        header: t('Industry'),
        sortKey: 'industry',
        cell: (a) => a.industry,
    },
    {
        key: 'phone',
        header: t('Phone'),
        className: 'font-mono tabular-nums',
        cell: (a) => a.phone,
    },
    { key: 'email', header: t('Email'), cell: (a) => a.email },
    {
        key: 'contacts',
        header: t('Contacts'),
        className: 'text-right font-mono tabular-nums',
        cell: (a) => a.contacts_count,
    },
    { key: 'owner', header: t('Owner'), cell: (a) => a.owner.name },
    {
        key: 'created',
        header: t('Added'),
        className: 'font-mono tabular-nums',
        sortKey: 'created_at',
        cell: (a) => formatDate(a.created_at),
    },
];

export default function Accounts({
    csvFields,
    accounts,
    filters,
    owners,
}: Props) {
    const list = useListFilters(index.url(), filters);
    const custom = useCustomFields('account');
    const cols = [...columns(), ...customColumns<Account>(custom)];
    const [hidden, toggle] = useHiddenColumns('accounts');
    const [layout, setLayout] = useViewMode('accounts');
    const [editing, setEditing] = useState<Account | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Account | null>(null);

    return (
        <>
            <Head title={t('Accounts')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Accounts')}
                    description={t('The companies you sell to.')}
                >
                    <Button variant="outline" asChild>
                        <Link href={duplicatesIndex('accounts')}>
                            <CopyIcon data-icon="inline-start" />
                            {t('Find duplicates')}
                        </Link>
                    </Button>
                    <CsvActions
                        type="accounts"
                        noun={t('accounts')}
                        fields={csvFields}
                        filters={filters}
                    />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add account')}
                    </Button>
                </PageHeader>

                <ListToolbar
                    savedViews={{ list: 'accounts', url: index.url(), filters }}
                    view={layout}
                    onViewChange={setLayout}
                    search={filters.search}
                    searchLabel={t('Search accounts')}
                    owner={filters.owner}
                    owners={owners}
                    onChange={list.apply}
                    columns={cols}
                    hiddenColumns={hidden}
                    onToggleColumn={toggle}
                >
                    <CustomFieldFilters
                        entity="account"
                        filters={filters}
                        onChange={list.apply}
                    />
                </ListToolbar>

                <DataTable
                    view={layout}
                    columns={cols}
                    hiddenColumns={hidden}
                    rows={accounts.data}
                    rowKey={(a) => a.id}
                    sort={list.sort}
                    onSort={list.sortBy}
                    empty={
                        filters.search
                            ? t('No accounts match “:search”.', {
                                  search: filters.search,
                              })
                            : t('No accounts yet. Add your first one.')
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
                <ListPagination page={accounts} />
            </div>

            <AccountFormDialog
                account={editing}
                owners={owners}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={deleting && AccountController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t('Its contacts stay, without an account.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Accounts.layout = { breadcrumbs: [{ title: 'Accounts', href: index() }] };
