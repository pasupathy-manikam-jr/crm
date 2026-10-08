import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';

const variant = {
    draft: 'secondary',
    pending_approval: 'warning',
    sent: 'info',
    accepted: 'success',
    declined: 'destructive',
} as const;

export function QuoteStatusBadge({ status }: { status: keyof typeof variant }) {
    const label = status.replace('_', ' ');

    return (
        <Badge variant={variant[status]}>
            {t(label.charAt(0).toUpperCase() + label.slice(1))}
        </Badge>
    );
}
