import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowsLeftRightIcon,
    KanbanIcon,
    PencilSimpleIcon,
    PlusIcon,
    RowsIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import DealController from '@/actions/App/Http/Controllers/DealController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import type { DealOptions } from '@/components/crm/deal-form-dialog';
import { DealFormDialog } from '@/components/crm/deal-form-dialog';
import { StageBadge } from '@/components/crm/stage-badge';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ListFilters } from '@/hooks/use-list-filters';
import {
    useHiddenColumns,
    useListFilters,
    useViewMode,
} from '@/hooks/use-list-filters';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { index, show } from '@/routes/deals';
import type { Deal, Paginated, Stage } from '@/types';
import { t } from '@/lib/i18n';

type Props = DealOptions & {
    view: 'board' | 'list';
    deals: Deal[] | Paginated<Deal>;
    filters: ListFilters;
};

export default function Deals({ view, deals, filters, ...options }: Props) {
    const { currency } = usePage().props;
    const list = useListFilters(index.url(), filters);
    const custom = useCustomFields('deal');
    const [hidden, toggle] = useHiddenColumns('deals');
    const [layout, setLayout] = useViewMode('deals');
    const [editing, setEditing] = useState<Deal | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Deal | null>(null);

    const moveTo = (deal: Deal, stage: Stage) => {
        if (deal.stage_id !== stage.id) {
            router.patch(
                DealController.moveStage.url(deal.id),
                { stage_id: stage.id },
                { preserveScroll: true, preserveState: true },
            );
        }
    };

    const columns: Column<Deal>[] = [
        {
            key: 'name',
            header: t('Deal'),
            sortKey: 'name',
            hideable: false,
            cell: (d) => (
                <Link
                    href={show(d.id)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                >
                    {d.name}
                </Link>
            ),
        },
        {
            key: 'account',
            header: t('Account'),
            cell: (d) =>
                d.account && (
                    <Link
                        href={showAccount(d.account.id)}
                        className="hover:underline"
                    >
                        {d.account.name}
                    </Link>
                ),
        },
        {
            key: 'stage',
            header: t('Stage'),
            cell: (d) => d.stage && <StageBadge stage={d.stage} />,
        },
        {
            key: 'amount',
            header: t('Amount'),
            sortKey: 'amount',
            className: 'text-right font-mono tabular-nums',
            cell: (d) => formatMoney(d.amount, currency),
        },
        {
            key: 'probability',
            header: t('Prob.'),
            className: 'text-right font-mono tabular-nums',
            cell: (d) => `${d.probability}%`,
        },
        {
            key: 'close',
            header: t('Expected close'),
            sortKey: 'expected_close_date',
            className: 'font-mono tabular-nums',
            cell: (d) =>
                d.expected_close_date && formatDate(d.expected_close_date),
        },
        { key: 'owner', header: t('Owner'), cell: (d) => d.owner.name },
    ];
    const cols = [...columns, ...customColumns<Deal>(custom)];

    return (
        <>
            <Head title={t('Deals')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Deals')}
                    description={t(
                        'Your pipeline. Drag a deal to another stage to move it.',
                    )}
                >
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={view}
                        onValueChange={(v) =>
                            v &&
                            list.apply({
                                view: v === 'list' ? 'list' : '',
                                sort: '',
                                direction: '',
                            })
                        }
                        aria-label={t('View')}
                    >
                        <ToggleGroupItem value="board" aria-label={t('Board')}>
                            <KanbanIcon />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label={t('List')}>
                            <RowsIcon />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add deal')}
                    </Button>
                </PageHeader>

                <ListToolbar
                    savedViews={{ list: 'deals', url: index.url(), filters }}
                    search={filters.search}
                    searchLabel={t('Search deals')}
                    owner={filters.owner}
                    owners={options.owners}
                    onChange={list.apply}
                    columns={view === 'list' ? cols : []}
                    hiddenColumns={hidden}
                    onToggleColumn={toggle}
                    view={view === 'list' ? layout : undefined}
                    onViewChange={setLayout}
                >
                    {view === 'list' && (
                        <CustomFieldFilters
                            entity="deal"
                            filters={filters}
                            onChange={list.apply}
                        />
                    )}
                </ListToolbar>

                {Array.isArray(deals) ? (
                    <Board
                        deals={deals}
                        stages={options.stages}
                        currency={currency}
                        onMove={moveTo}
                        onEdit={setEditing}
                        onDelete={setDeleting}
                    />
                ) : (
                    <>
                        <DataTable
                            view={layout}
                            columns={cols}
                            hiddenColumns={hidden}
                            rows={deals.data}
                            rowKey={(d) => d.id}
                            sort={list.sort}
                            onSort={list.sortBy}
                            empty={
                                filters.search
                                    ? t('No deals match “:search”.', {
                                          search: filters.search,
                                      })
                                    : t('No deals yet. Add your first one.')
                            }
                            actions={(d) => (
                                <>
                                    <DropdownMenuItem
                                        onSelect={() => setEditing(d)}
                                    >
                                        <PencilSimpleIcon />
                                        {t('Edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() => setDeleting(d)}
                                    >
                                        <TrashIcon />
                                        {t('Delete')}
                                    </DropdownMenuItem>
                                </>
                            )}
                        />
                        <ListPagination page={deals} />
                    </>
                )}
            </div>

            <DealFormDialog
                key={editing === 'new' ? 'new' : (editing?.id ?? 'closed')}
                deal={editing}
                options={options}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={deleting && DealController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t('The deal will be removed from the pipeline.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

/**
 * One column per stage. Cards drag between columns (mouse); every card also has a
 * "Move to" menu so the board works from the keyboard too.
 */
function Board({
    deals,
    stages,
    currency,
    onMove,
    onEdit,
    onDelete,
}: {
    deals: Deal[];
    stages: Stage[];
    currency: string;
    onMove: (deal: Deal, stage: Stage) => void;
    onEdit: (deal: Deal) => void;
    onDelete: (deal: Deal) => void;
}) {
    const [dragged, setDragged] = useState<Deal | null>(null);
    const [over, setOver] = useState<number | null>(null);

    return (
        <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:-mx-6 md:scroll-px-6 md:px-6">
            {stages.map((stage) => {
                const inStage = deals.filter((d) => d.stage_id === stage.id);
                const total = inStage.reduce(
                    (sum, d) => sum + Number(d.amount),
                    0,
                );

                return (
                    <section
                        key={stage.id}
                        aria-label={stage.name}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setOver(stage.id);
                        }}
                        onDragLeave={() =>
                            setOver((o) => (o === stage.id ? null : o))
                        }
                        onDrop={(e) => {
                            e.preventDefault();
                            setOver(null);
                            // The id travels in the drag data, so the drop never depends on React state timing.
                            const id = Number(
                                e.dataTransfer.getData('text/plain'),
                            );
                            const deal = deals.find((d) => d.id === id);

                            if (deal) {
                                onMove(deal, stage);
                            }
                        }}
                        className={cn(
                            'flex w-72 shrink-0 snap-start flex-col border bg-muted/60 transition-colors',
                            over === stage.id && 'border-primary bg-accent',
                        )}
                    >
                        <header
                            className={cn(
                                'flex flex-col gap-1 border-t-2 border-b bg-card px-3 py-2',
                                stage.kind === 'won'
                                    ? 'border-t-success'
                                    : stage.kind === 'lost'
                                      ? 'border-t-destructive'
                                      : 'border-t-primary',
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold">
                                    {stage.name}
                                </h2>
                                <span className="font-mono text-xs text-muted-foreground">
                                    {inStage.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground tabular-nums">
                                <span>{formatMoney(total, currency)}</span>
                                <span>{stage.probability}%</span>
                            </div>
                        </header>
                        <ol className="flex max-h-[calc(100svh-17rem)] min-h-24 flex-col gap-2 overflow-y-auto p-2">
                            {inStage.map((deal) => (
                                <li
                                    key={deal.id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            'text/plain',
                                            String(deal.id),
                                        );
                                        e.dataTransfer.effectAllowed = 'move';
                                        setDragged(deal);
                                    }}
                                    onDragEnd={() => setDragged(null)}
                                    className={cn(
                                        'group flex cursor-grab flex-col gap-2 border bg-card p-3 shadow-xs transition-[box-shadow,opacity] hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 active:cursor-grabbing',
                                        dragged?.id === deal.id && 'opacity-50',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <Link
                                            href={show(deal.id)}
                                            className="text-sm leading-snug font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            {deal.name}
                                        </Link>
                                        <CardMenu
                                            deal={deal}
                                            stages={stages}
                                            onMove={onMove}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                        />
                                    </div>
                                    {deal.account && (
                                        <span className="text-xs text-muted-foreground">
                                            {deal.account.name}
                                        </span>
                                    )}
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="font-mono font-medium tabular-nums">
                                            {formatMoney(deal.amount, currency)}
                                        </span>
                                        <span className="font-mono text-muted-foreground tabular-nums">
                                            {deal.expected_close_date
                                                ? formatDate(
                                                      deal.expected_close_date,
                                                  )
                                                : '—'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {deal.owner.name}
                                    </span>
                                </li>
                            ))}
                            {inStage.length === 0 && (
                                <li className="border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                                    {t('Drop a deal here')}
                                </li>
                            )}
                        </ol>
                    </section>
                );
            })}
        </div>
    );
}

function CardMenu({
    deal,
    stages,
    onMove,
    onEdit,
    onDelete,
}: {
    deal: Deal;
    stages: Stage[];
    onMove: (deal: Deal, stage: Stage) => void;
    onEdit: (deal: Deal) => void;
    onDelete: (deal: Deal) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('Actions for :name', { name: deal.name })}
                    className="opacity-60 group-hover:opacity-100"
                >
                    <ArrowsLeftRightIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('Move to')}</DropdownMenuLabel>
                <DropdownMenuGroup>
                    {stages
                        .filter((s) => s.id !== deal.stage_id)
                        .map((s) => (
                            <DropdownMenuItem
                                key={s.id}
                                onSelect={() => onMove(deal, s)}
                            >
                                {s.name}
                            </DropdownMenuItem>
                        ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => onEdit(deal)}>
                        <PencilSimpleIcon />
                        {t('Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onDelete(deal)}
                    >
                        <TrashIcon />
                        {t('Delete')}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

Deals.layout = { breadcrumbs: [{ title: 'Deals', href: index() }] };
