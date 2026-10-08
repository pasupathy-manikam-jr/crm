import { router } from '@inertiajs/react';
import { useState } from 'react';

export type ListFilters = Record<string, string> & {
    search: string;
    owner: string;
    sort: string;
    direction: string;
};

/**
 * Reloads a list page with changed filters, keeping them in the URL so a list can be
 * bookmarked or shared. Any filter change goes back to page 1.
 */
export function useListFilters(url: string, filters: ListFilters) {
    const apply = (changes: Partial<ListFilters>) => {
        const query = Object.fromEntries(
            Object.entries({ ...filters, ...changes }).filter(
                ([, v]) => v !== '',
            ),
        );
        router.get(url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const sortBy = (key: string) =>
        apply({
            sort: key,
            direction:
                filters.sort === key && filters.direction === 'asc'
                    ? 'desc'
                    : 'asc',
        });

    return {
        apply,
        sortBy,
        sort: {
            by: filters.sort,
            direction: filters.direction === 'desc' ? 'desc' : 'asc',
        } as const,
    };
}

/**
 * Which columns this viewer has hidden on a list, remembered in their browser only.
 */
export function useHiddenColumns(storageKey: string) {
    const key = `columns:${storageKey}`;
    const [hidden, setHidden] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
        } catch {
            return [];
        }
    });

    const toggle = (column: string) => {
        const next = hidden.includes(column)
            ? hidden.filter((c) => c !== column)
            : [...hidden, column];
        setHidden(next);

        try {
            localStorage.setItem(key, JSON.stringify(next));
        } catch {
            // Storage blocked (private window): the choice lasts for this visit only.
        }
    };

    return [hidden, toggle] as const;
}

/**
 * List or grid (cards) for a page, remembered in this viewer's browser only.
 */
export function useViewMode(storageKey: string) {
    const key = `view:${storageKey}`;
    const [view, setView] = useState<'list' | 'grid'>(() => {
        try {
            return localStorage.getItem(key) === 'grid' ? 'grid' : 'list';
        } catch {
            return 'list';
        }
    });

    const change = (next: 'list' | 'grid') => {
        setView(next);

        try {
            localStorage.setItem(key, next);
        } catch {
            // Storage blocked (private window): the choice lasts for this visit only.
        }
    };

    return [view, change] as const;
}
