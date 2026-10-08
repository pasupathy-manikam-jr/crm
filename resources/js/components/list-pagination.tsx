import { Link } from '@inertiajs/react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types';
import { t } from '@/lib/i18n';

export function ListPagination<T>({ page }: { page: Paginated<T> }) {
    if (page.total === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>
                {t(':from–:to of :total', {
                    from: page.from,
                    to: page.to,
                    total: page.total,
                })}
            </span>
            {page.last_page > 1 && (
                <div className="flex gap-2">
                    <Pager href={page.prev_page_url} label={t('Previous')}>
                        <CaretLeftIcon />
                    </Pager>
                    <Pager href={page.next_page_url} label={t('Next')}>
                        <CaretRightIcon />
                    </Pager>
                </div>
            )}
        </div>
    );
}

function Pager({
    href,
    label,
    children,
}: {
    href: string | null;
    label: string;
    children: React.ReactNode;
}) {
    if (href === null) {
        return (
            <Button variant="outline" size="icon" disabled aria-label={label}>
                {children}
            </Button>
        );
    }

    return (
        <Button variant="outline" size="icon" asChild>
            <Link href={href} preserveScroll aria-label={label}>
                {children}
            </Link>
        </Button>
    );
}
