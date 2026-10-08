import {
    ArrowDownIcon,
    ArrowUpIcon,
    CaretUpDownIcon,
    DotsThreeIcon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type Column<T> = {
    key: string;
    header: ReactNode;
    cell: (row: T) => ReactNode;
    className?: string;
    /** Server column a header click sorts by. */
    sortKey?: string;
    /** False keeps the column out of the column picker. */
    hideable?: boolean;
};

export type Sort = { by: string; direction: 'asc' | 'desc' };

type Props<T> = {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string | number;
    /** DropdownMenuItem elements for the row; renders the sticky action column. */
    actions?: (row: T) => ReactNode;
    empty?: ReactNode;
    className?: string;
    sort?: Sort;
    onSort?: (key: string) => void;
    /** Column keys to leave out (see useHiddenColumns). */
    hiddenColumns?: string[];
    /** "grid" shows each row as a card (see useViewMode). */
    view?: 'list' | 'grid';
};

/**
 * List table with a header that stays visible while the rows scroll, and an
 * action column pinned to the right while wide tables scroll sideways. The
 * table is its own scroll container, so its height is capped to the viewport.
 */
export function DataTable<T>({
    columns,
    rows,
    rowKey,
    actions,
    empty = t('No records found.'),
    className,
    sort,
    onSort,
    hiddenColumns = [],
    view = 'list',
}: Props<T>) {
    const shown = columns.filter((c) => !hiddenColumns.includes(c.key));

    if (view === 'grid') {
        return (
            <Grid
                columns={shown}
                rows={rows}
                rowKey={rowKey}
                actions={actions}
                empty={empty}
            />
        );
    }

    const sticky = 'sticky right-0 bg-card shadow-[-1px_0_0_var(--border)]';

    return (
        <Table
            containerClassName={cn(
                'max-h-[calc(100svh-12rem)] overflow-auto rounded-md border bg-card shadow-sm shadow-primary/5',
                className,
            )}
        >
            <TableHeader className="sticky top-0 z-20 bg-muted shadow-[0_1px_0_var(--border)] [&_th]:text-muted-foreground">
                <TableRow>
                    {shown.map((c) => {
                        const sorted = c.sortKey && sort?.by === c.sortKey;

                        return (
                            <TableHead
                                key={c.key}
                                className={c.className}
                                aria-sort={
                                    sorted
                                        ? sort.direction === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : undefined
                                }
                            >
                                {c.sortKey && onSort ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-ml-3"
                                        onClick={() => onSort(c.sortKey!)}
                                    >
                                        {c.header}
                                        {sorted ? (
                                            sort.direction === 'asc' ? (
                                                <ArrowUpIcon />
                                            ) : (
                                                <ArrowDownIcon />
                                            )
                                        ) : (
                                            <CaretUpDownIcon className="text-muted-foreground" />
                                        )}
                                    </Button>
                                ) : (
                                    c.header
                                )}
                            </TableHead>
                        );
                    })}
                    {actions && (
                        <TableHead className={cn(sticky, 'z-30 w-12 bg-muted')}>
                            <span className="sr-only">{t('Actions')}</span>
                        </TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={shown.length + (actions ? 1 : 0)}
                            className="h-24 text-center text-muted-foreground"
                        >
                            {empty}
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow
                            key={rowKey(row)}
                            className="hover:bg-accent/60"
                        >
                            {shown.map((c) => (
                                <TableCell key={c.key} className={c.className}>
                                    {c.cell(row)}
                                </TableCell>
                            ))}
                            {actions && (
                                <TableCell className={cn(sticky, 'z-10 w-12')}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t('Row actions')}
                                            >
                                                <DotsThreeIcon />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuGroup>
                                                {actions(row)}
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

/** Each row as a card: the first column is the title, the rest label/value pairs. */
function Grid<T>({
    columns,
    rows,
    rowKey,
    actions,
    empty,
}: Pick<Props<T>, 'columns' | 'rows' | 'rowKey' | 'actions' | 'empty'>) {
    const [title, ...fields] = columns;

    if (rows.length === 0) {
        return (
            <div className="border border-dashed bg-card px-4 py-10 text-center text-muted-foreground">
                {empty}
            </div>
        );
    }

    return (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {rows.map((row) => (
                <li
                    key={rowKey(row)}
                    className="flex flex-col gap-3 border bg-card p-4 shadow-xs transition-shadow hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 text-base">
                            {title?.cell(row)}
                        </div>
                        {actions && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={t('Row actions')}
                                        className="-mt-1 -mr-2"
                                    >
                                        <DotsThreeIcon />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuGroup>
                                        {actions(row)}
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                        {fields.map((c) => (
                            <div key={c.key} className="contents">
                                <dt className="text-muted-foreground">
                                    {typeof c.header === 'string'
                                        ? c.header
                                        : null}
                                </dt>
                                <dd
                                    className={cn(
                                        'min-w-0 truncate',
                                        c.className?.replace(
                                            /\btext-right\b|\bw-px\b/g,
                                            '',
                                        ),
                                    )}
                                >
                                    {c.cell(row) || (
                                        <span className="text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </li>
            ))}
        </ul>
    );
}
