import { Head, Link } from '@inertiajs/react';
import { index as duplicatesIndex } from '@/routes/duplicates';
import {
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
    CopyIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import ContactController from '@/actions/App/Http/Controllers/ContactController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { CsvActions } from '@/components/crm/csv-actions';
import type { CsvField } from '@/components/crm/import-dialog';
import { ContactFormDialog } from '@/components/crm/contact-form-dialog';
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
import { show as showAccount } from '@/routes/accounts';
import { index, show } from '@/routes/contacts';
import type { Contact, Option, Paginated } from '@/types';
import { t } from '@/lib/i18n';

type Props = {
    csvFields: CsvField[];
    contacts: Paginated<Contact>;
    filters: ListFilters;
    owners: Option[];
    accounts: Option[];
};

const columns = (): Column<Contact>[] => [
    {
        key: 'name',
        header: t('Name'),
        sortKey: 'last_name',
        hideable: false,
        cell: (c) => (
            <Link
                href={show(c.id)}
                className="font-medium text-primary underline-offset-4 hover:underline"
            >
                {c.full_name}
            </Link>
        ),
    },
    { key: 'title', header: t('Job title'), cell: (c) => c.job_title },
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
    { key: 'email', header: t('Email'), cell: (c) => c.email },
    {
        key: 'phone',
        header: t('Phone'),
        className: 'font-mono tabular-nums',
        cell: (c) => c.phone,
    },
    { key: 'owner', header: t('Owner'), cell: (c) => c.owner.name },
    {
        key: 'created',
        header: t('Added'),
        className: 'font-mono tabular-nums',
        sortKey: 'created_at',
        cell: (c) => formatDate(c.created_at),
    },
];

export default function Contacts({
    csvFields,
    contacts,
    filters,
    owners,
    accounts,
}: Props) {
    const list = useListFilters(index.url(), filters);
    const custom = useCustomFields('contact');
    const cols = [...columns(), ...customColumns<Contact>(custom)];
    const [hidden, toggle] = useHiddenColumns('contacts');
    const [layout, setLayout] = useViewMode('contacts');
    const [editing, setEditing] = useState<Contact | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Contact | null>(null);

    return (
        <>
            <Head title={t('Contacts')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Contacts')}
                    description={t('The people you deal with.')}
                >
                    <Button variant="outline" asChild>
                        <Link href={duplicatesIndex('contacts')}>
                            <CopyIcon data-icon="inline-start" />
                            {t('Find duplicates')}
                        </Link>
                    </Button>
                    <CsvActions
                        type="contacts"
                        noun={t('contacts')}
                        fields={csvFields}
                        filters={filters}
                    />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add contact')}
                    </Button>
                </PageHeader>

                <ListToolbar
                    savedViews={{ list: 'contacts', url: index.url(), filters }}
                    view={layout}
                    onViewChange={setLayout}
                    search={filters.search}
                    searchLabel={t('Search contacts')}
                    owner={filters.owner}
                    owners={owners}
                    onChange={list.apply}
                    columns={cols}
                    hiddenColumns={hidden}
                    onToggleColumn={toggle}
                >
                    <CustomFieldFilters
                        entity="contact"
                        filters={filters}
                        onChange={list.apply}
                    />
                </ListToolbar>

                <DataTable
                    view={layout}
                    columns={cols}
                    hiddenColumns={hidden}
                    rows={contacts.data}
                    rowKey={(c) => c.id}
                    sort={list.sort}
                    onSort={list.sortBy}
                    empty={
                        filters.search
                            ? t('No contacts match “:search”.', {
                                  search: filters.search,
                              })
                            : t('No contacts yet. Add your first one.')
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
                <ListPagination page={contacts} />
            </div>

            <ContactFormDialog
                contact={editing}
                owners={owners}
                accounts={accounts}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={deleting && ContactController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.full_name })}
                description={t(
                    "They'll be removed from your contacts and their account.",
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Contacts.layout = { breadcrumbs: [{ title: 'Contacts', href: index() }] };
