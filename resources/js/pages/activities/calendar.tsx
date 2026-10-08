import { Head, router } from '@inertiajs/react';
import { CaretLeftIcon, CaretRightIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import ActivityController from '@/actions/App/Http/Controllers/ActivityController';
import { ActivityFormDialog } from '@/components/crm/activity-form-dialog';
import { activityIcons } from '@/components/crm/activity-item';
import { TasksViewToggle } from '@/components/crm/tasks-view-toggle';
import { toYmd } from '@/components/date-picker';
import { FilterSelect } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { intlLocale, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { calendar, index } from '@/routes/activities';
import type { Activity, Option } from '@/types';

type Props = {
    /** Y-m of the month shown. */
    month: string;
    activities: Activity[];
    filters: { owner: string };
    owners: Option[];
    types: Option[];
};

/** Whole weeks (Monday first) covering the month. */
function weeksOf(month: Date): Date[][] {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const weeks: Date[][] = [];

    // Stop on the first Monday after the month ends.
    for (
        const day = new Date(start);
        day <= last || day.getDay() !== 1;
        day.setDate(day.getDate() + 1)
    ) {
        if (day.getDay() === 1) {
            weeks.push([]);
        }

        weeks[weeks.length - 1].push(new Date(day));
    }

    return weeks;
}

const ym = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function ActivityCalendar({
    month,
    activities,
    filters,
    owners,
    types,
}: Props) {
    const [editing, setEditing] = useState<Activity | 'new' | null>(null);
    const [newDue, setNewDue] = useState<string>();
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [y, m] = month.split('-').map(Number);
    const shown = new Date(y, m - 1, 1);
    const today = toYmd(new Date());
    const weekdayFormat = new Intl.DateTimeFormat(intlLocale(), {
        weekday: 'short',
    });
    // 1 January 2024 was a Monday.
    const weekdays = Array.from({ length: 7 }, (_, i) =>
        weekdayFormat.format(new Date(2024, 0, 1 + i)),
    );
    const byDay = Map.groupBy(activities, (a) => toYmd(new Date(a.due_at!)));

    const go = (changes: { month?: string; owner?: string }) =>
        router.get(
            calendar.url(),
            {
                month: changes.month ?? month,
                ...((changes.owner ?? filters.owner)
                    ? { owner: changes.owner ?? filters.owner }
                    : {}),
            },
            { preserveScroll: true, preserveState: true },
        );
    const shift = (months: number) =>
        go({ month: ym(new Date(y, m - 1 + months, 1)) });

    const moveTo = (id: number, day: string) => {
        const activity = activities.find((a) => a.id === id);

        if (activity && toYmd(new Date(activity.due_at!)) !== day) {
            router.patch(
                ActivityController.reschedule.url(id),
                { date: day },
                { preserveScroll: true, preserveState: true },
            );
        }
    };

    return (
        <>
            <Head title={t('Calendar')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Calendar')}
                    description={t(
                        'Scheduled calls, meetings and tasks. Drag one to another day to move it.',
                    )}
                >
                    <TasksViewToggle value="calendar" />
                    <Button
                        onClick={() => {
                            setNewDue(undefined);
                            setEditing('new');
                        }}
                    >
                        <PlusIcon data-icon="inline-start" />
                        {t('Log activity')}
                    </Button>
                </PageHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label={t('Previous month')}
                        onClick={() => shift(-1)}
                    >
                        <CaretLeftIcon />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label={t('Next month')}
                        onClick={() => shift(1)}
                    >
                        <CaretRightIcon />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => go({ month: ym(new Date()) })}
                    >
                        {t('Today')}
                    </Button>
                    <h2 className="ml-2 text-lg font-semibold">
                        {shown.toLocaleDateString(intlLocale(), {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </h2>
                    {owners.length > 1 && (
                        <div className="ml-auto">
                            <FilterSelect
                                label={t('Assigned to')}
                                value={filters.owner}
                                allLabel={t('Assigned to me')}
                                options={[
                                    { value: 'everyone', label: t('Everyone') },
                                    ...owners,
                                ]}
                                onChange={(owner) => go({ owner })}
                            />
                        </div>
                    )}
                </div>

                <div
                    role="grid"
                    aria-label={t('Month')}
                    className="overflow-x-auto border bg-card shadow-sm shadow-primary/5"
                >
                    <div
                        role="row"
                        className="grid min-w-[56rem] grid-cols-7 border-b bg-muted"
                    >
                        {weekdays.map((d) => (
                            <div
                                key={d}
                                role="columnheader"
                                className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                    {weeksOf(shown).map((week) => (
                        <div
                            key={toYmd(week[0])}
                            role="row"
                            className="grid min-w-[56rem] grid-cols-7 border-b last:border-b-0"
                        >
                            {week.map((day) => {
                                const key = toYmd(day);
                                const inMonth = day.getMonth() === m - 1;
                                const items = byDay.get(key) ?? [];

                                return (
                                    <div
                                        key={key}
                                        role="gridcell"
                                        aria-label={day.toLocaleDateString(
                                            intlLocale(),
                                            {
                                                dateStyle: 'full',
                                            },
                                        )}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOver(key);
                                        }}
                                        onDragLeave={() =>
                                            setDragOver((d) =>
                                                d === key ? null : d,
                                            )
                                        }
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragOver(null);
                                            moveTo(
                                                Number(
                                                    e.dataTransfer.getData(
                                                        'text/plain',
                                                    ),
                                                ),
                                                key,
                                            );
                                        }}
                                        className={cn(
                                            'group flex min-h-32 flex-col gap-1 border-r p-1.5 last:border-r-0',
                                            !inMonth && 'bg-muted/40',
                                            dragOver === key &&
                                                'bg-accent ring-2 ring-primary ring-inset',
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={cn(
                                                    'flex size-7 items-center justify-center font-mono text-sm tabular-nums',
                                                    !inMonth &&
                                                        'text-muted-foreground',
                                                    key === today &&
                                                        'bg-primary font-semibold text-primary-foreground',
                                                )}
                                            >
                                                {day.getDate()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                                                aria-label={t(
                                                    'Log activity on :date',
                                                    {
                                                        date: day.toLocaleDateString(
                                                            intlLocale(),
                                                            {
                                                                dateStyle:
                                                                    'full',
                                                            },
                                                        ),
                                                    },
                                                )}
                                                onClick={() => {
                                                    setNewDue(`${key}T09:00`);
                                                    setEditing('new');
                                                }}
                                            >
                                                <PlusIcon />
                                            </Button>
                                        </div>
                                        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                                            {items.map((a) => (
                                                <CalendarItem
                                                    key={a.id}
                                                    activity={a}
                                                    overdue={
                                                        !a.done_at &&
                                                        key < today
                                                    }
                                                    onOpen={() => setEditing(a)}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <ActivityFormDialog
                key={
                    editing === 'new'
                        ? `new-${newDue}`
                        : (editing?.id ?? 'closed')
                }
                activity={editing}
                types={types}
                owners={owners}
                defaultDue={newDue}
                onClose={() => setEditing(null)}
            />
        </>
    );
}

function CalendarItem({
    activity: a,
    overdue,
    onOpen,
}: {
    activity: Activity;
    overdue: boolean;
    onOpen: () => void;
}) {
    const Icon = activityIcons[a.type];
    const time = new Date(a.due_at!).toLocaleTimeString(intlLocale(), {
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <li>
            <button
                type="button"
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(a.id));
                    e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={onOpen}
                title={[a.subject, a.regarding?.name, a.owner?.name]
                    .filter(Boolean)
                    .join(' · ')}
                className={cn(
                    'flex w-full cursor-grab items-center gap-1.5 border-l-2 bg-accent/60 px-1.5 py-1 text-left text-xs hover:bg-accent active:cursor-grabbing',
                    a.done_at
                        ? 'border-l-muted-foreground/40 text-muted-foreground line-through'
                        : overdue
                          ? 'border-l-destructive bg-destructive/10 text-destructive'
                          : 'border-l-primary',
                )}
            >
                <Icon className="size-3.5 shrink-0" />
                <span className="shrink-0 font-mono tabular-nums">{time}</span>
                <span className="truncate">{a.subject}</span>
            </button>
        </li>
    );
}

ActivityCalendar.layout = {
    breadcrumbs: [
        { title: 'My tasks', href: index() },
        { title: 'Calendar', href: calendar() },
    ],
};
