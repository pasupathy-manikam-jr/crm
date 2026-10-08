import { Link, router } from '@inertiajs/react';
import {
    CalendarBlankIcon,
    CheckSquareIcon,
    EnvelopeSimpleIcon,
    PhoneIcon,
} from '@phosphor-icons/react';
import ActivityController from '@/actions/App/Http/Controllers/ActivityController';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatDue, isOverdue } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { show as showContact } from '@/routes/contacts';
import { show as showDeal } from '@/routes/deals';
import { show as showLead } from '@/routes/leads';
import { show as showCase } from '@/routes/cases';
import { show as showContract } from '@/routes/contracts';
import type { Activity } from '@/types';
import { t } from '@/lib/i18n';

export const activityIcons = {
    call: PhoneIcon,
    email: EnvelopeSimpleIcon,
    meeting: CalendarBlankIcon,
    task: CheckSquareIcon,
};

const recordLinks = {
    account: showAccount,
    contact: showContact,
    lead: showLead,
    deal: showDeal,
    case: showCase,
    contract: showContract,
};

/** Tick box that marks an activity done, or reopens it. */
export function DoneCheckbox({ activity }: { activity: Activity }) {
    return (
        <Checkbox
            checked={!!activity.done_at}
            onCheckedChange={() =>
                router.patch(
                    ActivityController.toggleDone.url(activity.id),
                    {},
                    { preserveScroll: true, preserveState: true },
                )
            }
            aria-label={
                activity.done_at
                    ? t('Reopen :subject', { subject: activity.subject })
                    : t('Mark :subject done', { subject: activity.subject })
            }
        />
    );
}

/** Subject with its type icon; struck through once done. */
export function ActivitySubject({ activity }: { activity: Activity }) {
    const Icon = activityIcons[activity.type];

    return (
        <span
            className={cn(
                'flex min-w-0 items-center gap-2',
                activity.done_at && 'text-muted-foreground line-through',
            )}
        >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{activity.subject}</span>
        </span>
    );
}

/** Due date; overdue ones in red. */
export function ActivityDue({ activity }: { activity: Activity }) {
    if (!activity.due_at) {
        return <span className="text-muted-foreground">{t('No date')}</span>;
    }

    return (
        <span
            className={cn(
                'font-mono tabular-nums',
                isOverdue(activity.due_at, activity.done_at) &&
                    'font-medium text-destructive',
            )}
        >
            {formatDue(activity.due_at)}
        </span>
    );
}

/** Link to the record the activity is about. */
export function ActivityRegarding({ activity }: { activity: Activity }) {
    const r = activity.regarding;

    if (!r) {
        return null;
    }

    const href = recordLinks[r.type as keyof typeof recordLinks];

    return (
        <Link href={href(r.id)} className="hover:underline">
            {r.name}
        </Link>
    );
}
