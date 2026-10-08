import {
    ColumnsIcon,
    MagnifyingGlassIcon,
    RowsIcon,
    SquaresFourIcon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import type { Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SavedViewsMenu } from '@/components/saved-views-menu';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FilterSelect } from '@/components/form-field';
import type { Option } from '@/types';
import { t } from '@/lib/i18n';

type Props<T> = {
    search: string;
    searchLabel: string;
    owner: string;
    owners: Option[];
    onChange: (changes: { search?: string; owner?: string }) => void;
    columns: Column<T>[];
    hiddenColumns: string[];
    onToggleColumn: (key: string) => void;
    /** Extra filters for this list, placed after the owner filter. */
    children?: ReactNode;
    /** With these, a List/Grid toggle is shown. */
    view?: 'list' | 'grid';
    onViewChange?: (view: 'list' | 'grid') => void;
    /** Label of the owner filter's empty choice. */
    ownerAllLabel?: string;
    /** With this, the Views menu (saved filters) is shown. */
    savedViews?: { list: string; url: string; filters: Record<string, string> };
};

/** MagnifyingGlassIcon, owner filter, page-specific filters and the column picker above a list. */
export function ListToolbar<T>({
    search,
    searchLabel,
    owner,
    owners,
    onChange,
    columns,
    hiddenColumns,
    onToggleColumn,
    children,
    view,
    onViewChange,
    ownerAllLabel = t('All owners'),
    savedViews,
}: Props<T>) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <form
                role="search"
                className="relative w-full sm:max-w-xs"
                onSubmit={(e) => {
                    e.preventDefault();
                    onChange({
                        search: (
                            e.currentTarget.elements.namedItem(
                                'search',
                            ) as HTMLInputElement
                        ).value,
                    });
                }}
            >
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    name="search"
                    type="search"
                    defaultValue={search}
                    placeholder={searchLabel}
                    aria-label={searchLabel}
                    className="pl-9"
                />
            </form>

            {owners.length > 1 && (
                <FilterSelect
                    label={t('Owner')}
                    value={owner}
                    allLabel={ownerAllLabel}
                    options={owners}
                    onChange={(value) => onChange({ owner: value })}
                />
            )}
            {children}
            {savedViews && <SavedViewsMenu {...savedViews} />}

            {view && onViewChange && (
                <ViewToggle
                    view={view}
                    onChange={onViewChange}
                    className="ml-auto"
                />
            )}
            {columns.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className={view ? undefined : 'ml-auto'}
                        >
                            <ColumnsIcon data-icon="inline-start" />
                            {t('Columns')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {t('Show columns')}
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {columns
                                .filter((c) => c.hideable !== false)
                                .map((c) => (
                                    <DropdownMenuCheckboxItem
                                        key={c.key}
                                        checked={!hiddenColumns.includes(c.key)}
                                        onCheckedChange={() =>
                                            onToggleColumn(c.key)
                                        }
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        {c.header}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

/** List (table) or Grid (cards) switch for a list page. */
export function ViewToggle({
    view,
    onChange,
    className,
}: {
    view: 'list' | 'grid';
    onChange: (view: 'list' | 'grid') => void;
    className?: string;
}) {
    return (
        <ToggleGroup
            type="single"
            variant="outline"
            value={view}
            onValueChange={(v) => v && onChange(v as 'list' | 'grid')}
            aria-label={t('Layout')}
            className={className}
        >
            <ToggleGroupItem value="list" aria-label={t('List view')}>
                <RowsIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label={t('Grid view')}>
                <SquaresFourIcon />
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
