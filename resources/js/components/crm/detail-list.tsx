import type { ReactNode } from 'react';

/** Label/value pairs on a record's page; empty values show a muted dash. */
export function DetailList({
    items,
}: {
    items: { label: string; value: ReactNode }[];
}) {
    return (
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-col gap-1">
                    <dt className="text-sm text-muted-foreground">
                        {item.label}
                    </dt>
                    <dd className="text-sm break-words whitespace-pre-line">
                        {item.value || (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
