import { Badge } from '@/components/ui/badge';
import type { Stage } from '@/types';

/** A deal's stage: open stages neutral, won green, lost red. */
export function StageBadge({ stage }: { stage: Pick<Stage, 'name' | 'kind'> }) {
    const variant =
        stage.kind === 'won'
            ? 'success'
            : stage.kind === 'lost'
              ? 'destructive'
              : 'secondary';

    return <Badge variant={variant}>{stage.name}</Badge>;
}
