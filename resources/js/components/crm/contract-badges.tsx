import { Badge } from '@/components/ui/badge';
import { fromYmd } from '@/components/date-picker';
import { t } from '@/lib/i18n';
import type { Contract } from '@/types';

const variant = {
    draft: 'secondary',
    active: 'success',
    expired: 'destructive',
    cancelled: 'outline',
    renewed: 'info',
} as const;

export function ContractStatusBadge({
    status,
}: {
    status: Contract['status'];
}) {
    return (
        <Badge variant={variant[status]} className="capitalize">
            {t(status.charAt(0).toUpperCase() + status.slice(1))}
        </Badge>
    );
}

/** Days until an active contract ends: amber inside its notice window, red once past. */
export function EndsInBadge({
    contract,
}: {
    contract: Pick<Contract, 'status' | 'end_date' | 'notice_days'>;
}) {
    const end = fromYmd(contract.end_date);

    if (contract.status !== 'active' || !end) {
        return null;
    }

    const days = Math.round(
        (end.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
    );

    if (days < 0) {
        return <Badge variant="destructive">{t('Ended')}</Badge>;
    }

    return (
        <Badge variant={days <= contract.notice_days ? 'warning' : 'outline'}>
            {days === 0
                ? t('Ends today')
                : days === 1
                  ? t('1 day left')
                  : t(':count days left', { count: days })}
        </Badge>
    );
}
