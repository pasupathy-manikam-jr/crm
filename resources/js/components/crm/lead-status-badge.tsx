import { Badge } from '@/components/ui/badge';
import type { Option } from '@/types';

const variant: Record<string, 'info' | 'warning' | 'success' | 'destructive'> =
    {
        new: 'info',
        contacted: 'warning',
        qualified: 'success',
        lost: 'destructive',
    };

export function LeadStatusBadge({
    status,
    statuses,
}: {
    status: string;
    statuses: Option[];
}) {
    return (
        <Badge variant={variant[status] ?? 'outline'}>
            {statuses.find((s) => s.value === status)?.label ?? status}
        </Badge>
    );
}
