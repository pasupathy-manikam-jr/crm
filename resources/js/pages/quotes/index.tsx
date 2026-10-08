import { Head, Link, usePage } from '@inertiajs/react';
import { PlusIcon } from '@phosphor-icons/react';
import { QuoteStatusBadge } from '@/components/crm/quote-status-badge';
import type { Column } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterSelect } from '@/components/form-field';
import { ListPagination } from '@/components/list-pagination';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { ListFilters } from '@/hooks/use-list-filters';
import {
    useHiddenColumns,
    useListFilters,
    useViewMode,
} from '@/hooks/use-list-filters';
import { t } from '@/lib/i18n';
import { formatDate, formatMoney } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { create, index, show } from '@/routes/quotes';
import type { Option, Paginated, Quote } from '@/types';

type Props = {
    quotes: Paginated<Quote>;
    filters: ListFilters;
    owners: Option[];
    statuses: Option[];
};

export default function Quotes({ quotes, filters, owners, statuses }: Props) {
    const { currency } = usePage().props;
    const list = useListFilters(index.url(), filters);
    const [hidden, toggle] = useHiddenColumns('quotes');
    const [layout, setLayout] = useViewMode('quotes');

    const columns: Column<Quote>[] = [
        {
            key: 'number',
            header: t('Quote'),
            sortKey: 'number',
            hideable: false,
            cell: (q) => (
                <Link
                    href={show(q.id)}
                    className="font-mono font-medium text-primary underline-offset-4 hover:underline"
                >
                    {q.number}
                </Link>
            ),
        },
        {
            key: 'account',
            header: t('Account'),
            cell: (q) =>
                q.account && (
                    <Link
                        href={showAccount(q.account.id)}
                        className="hover:underline"
                    >
                        {q.account.name}
                    </Link>
                ),
        },
        {
            key: 'status',
            header: t('Status'),
            cell: (q) => <QuoteStatusBadge status={q.status} />,
        },
        {
            key: 'total',
            header: t('Total'),
            sortKey: 'total',
            className: 'text-right font-mono tabular-nums',
            cell: (q) => formatMoney(q.total, currency),
        },
        {
            key: 'valid',
            header: t('Valid until'),
            sortKey: 'valid_until',
            className: 'font-mono tabular-nums',
            cell: (q) => q.valid_until && formatDate(q.valid_until),
        },
        { key: 'owner', header: t('Owner'), cell: (q) => q.owner.name },
        {
            key: 'created',
            header: t('Created'),
            sortKey: 'created_at',
            className: 'font-mono tabular-nums',
            cell: (q) => formatDate(q.created_at),
        },
    ];

    return (
        <>
            <Head title={t('Quotes')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Quotes')}
                    description={t(
                        'Priced offers to your accounts. Open one to print or save it as PDF.',
                    )}
                >
                    <Button asChild>
                        <Link href={create()}>
                            <PlusIcon data-icon="inline-start" />
                            {t('New quote')}
                        </Link>
                    </Button>
                </PageHeader>

                <ListToolbar
                    savedViews={{ list: 'quotes', url: index.url(), filters }}
                    search={filters.search}
                    searchLabel={t('Search quote number')}
                    owner={filters.owner}
                    owners={owners}
                    onChange={list.apply}
                    columns={columns}
                    hiddenColumns={hidden}
                    onToggleColumn={toggle}
                    view={layout}
                    onViewChange={setLayout}
                >
                    <FilterSelect
                        label={t('Status')}
                        value={filters.status}
                        allLabel={t('All statuses')}
                        options={statuses}
                        onChange={(status) => list.apply({ status })}
                    />
                </ListToolbar>

                <DataTable
                    view={layout}
                    columns={columns}
                    hiddenColumns={hidden}
                    rows={quotes.data}
                    rowKey={(q) => q.id}
                    sort={list.sort}
                    onSort={list.sortBy}
                    empty={
                        filters.search || filters.status
                            ? t('No quotes match these filters.')
                            : t(
                                  'No quotes yet. Create one from here or from a deal.',
                              )
                    }
                />
                <ListPagination page={quotes} />
            </div>
        </>
    );
}

Quotes.layout = { breadcrumbs: [{ title: 'Quotes', href: index() }] };
