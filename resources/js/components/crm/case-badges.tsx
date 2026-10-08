import { Badge } from '@/components/ui/badge';
import type { SupportCase } from '@/types';
import { t } from '@/lib/i18n';

const priorityVariant = {
    low: 'outline',
    normal: 'info',
    high: 'warning',
    urgent: 'destructive',
} as const;

const statusVariant = {
    open: 'info',
    pending: 'warning',
    resolved: 'success',
    closed: 'outline',
} as const;

export function CasePriorityBadge({
    priority,
}: {
    priority: SupportCase['priority'];
}) {
    return (
        <Badge variant={priorityVariant[priority]} className="capitalize">
            {t(priority.charAt(0).toUpperCase() + priority.slice(1))}
        </Badge>
    );
}

export function CaseStatusBadge({ status }: { status: SupportCase['status'] }) {
    return (
        <Badge variant={statusVariant[status]} className="capitalize">
            {t(status.charAt(0).toUpperCase() + status.slice(1))}
        </Badge>
    );
}

/** "3 hours", "2 days": the gap between two times, rounded to the largest unit. */
function span(ms: number): string {
    const minutes = Math.round(Math.abs(ms) / 60_000);

    if (minutes < 60) {
        return minutes === 1
            ? t('1 minute')
            : t(':count minutes', { count: minutes });
    }

    if (minutes < 48 * 60) {
        const hours = Math.round(minutes / 60);

        return hours === 1 ? t('1 hour') : t(':count hours', { count: hours });
    }

    const days = Math.round(minutes / 1440);

    return days === 1 ? t('1 day') : t(':count days', { count: days });
}

/**
 * Where a case stands against its SLA: met or missed once resolved; otherwise time left,
 * amber in the last 4 hours, red once overdue.
 */
export function SlaBadge({
    supportCase,
}: {
    supportCase: Pick<SupportCase, 'sla_due_at' | 'resolved_at'>;
}) {
    const due = new Date(supportCase.sla_due_at).getTime();

    if (supportCase.resolved_at) {
        return new Date(supportCase.resolved_at).getTime() <= due ? (
            <Badge variant="success">{t('SLA met')}</Badge>
        ) : (
            <Badge variant="destructive">{t('SLA missed')}</Badge>
        );
    }

    const left = due - Date.now();

    if (left < 0) {
        return (
            <Badge variant="destructive">
                {t('Overdue :time', { time: span(left) })}
            </Badge>
        );
    }

    return (
        <Badge variant={left < 4 * 3_600_000 ? 'warning' : 'outline'}>
            {t(':time left', { time: span(left) })}
        </Badge>
    );
}
