import { formatDateTime } from '@/lib/utils';
import type { HistoryEntry } from '@/types';
import { t } from '@/lib/i18n';

const verbs = {
    created: 'created this record',
    updated: 'changed',
    deleted: 'deleted this record',
};

function show(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return (
            <span className="text-muted-foreground italic">{t('empty')}</span>
        );
    }

    const text =
        typeof value === 'object'
            ? JSON.stringify(value)
            : String(value as string | number | boolean);

    return <span className="font-medium">{text}</span>;
}

/** Who changed what and when, newest first. */
export function HistoryPanel({ history }: { history: HistoryEntry[] }) {
    if (history.length === 0) {
        return (
            <p className="border border-dashed bg-card px-4 py-8 text-center text-muted-foreground">
                {t('No changes recorded yet.')}
            </p>
        );
    }

    return (
        <ol className="relative flex flex-col gap-4 border-l pl-5">
            {history.map((entry) => (
                <li key={entry.id} className="relative flex flex-col gap-1.5">
                    <span
                        className="absolute top-1.5 -left-[25px] size-2.5 border-2 border-background bg-primary"
                        aria-hidden
                    />
                    <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                            {entry.user ?? t('System')}
                        </span>{' '}
                        {t(verbs[entry.event])}
                        {entry.at && (
                            <>
                                {' · '}
                                <span className="font-mono tabular-nums">
                                    {formatDateTime(entry.at)}
                                </span>
                            </>
                        )}
                    </div>
                    {entry.changes.length > 0 && (
                        <ul className="flex flex-col gap-1 border bg-card px-3 py-2">
                            {entry.changes.map((c) => (
                                <li
                                    key={c.field}
                                    className="flex flex-wrap gap-x-1.5"
                                >
                                    <span className="text-muted-foreground">
                                        {c.field}:
                                    </span>
                                    {show(c.from)}
                                    <span className="text-muted-foreground">
                                        →
                                    </span>
                                    {show(c.to)}
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ol>
    );
}
