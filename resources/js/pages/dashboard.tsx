import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRightIcon } from '@phosphor-icons/react';
import {
    ActivityDue,
    ActivityRegarding,
    ActivitySubject,
    DoneCheckbox,
} from '@/components/crm/activity-item';
import { formatDate, formatMoney } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as activities } from '@/routes/activities';
import { index as deals, show as showDeal } from '@/routes/deals';
import type { Activity } from '@/types';
import { t } from '@/lib/i18n';

type Props = {
    stats: {
        openAmount: number;
        openCount: number;
        weightedAmount: number;
        wonAmount: number;
        wonCount: number;
        winRate: number | null;
        newLeads: number;
    };
    byStage: { id: number; name: string; count: number; amount: number }[];
    tasks: Activity[];
    closingSoon: {
        id: number;
        name: string;
        amount: string;
        probability: number;
        expected_close_date: string;
        account: { id: number; name: string } | null;
    }[];
};

export default function Dashboard({
    stats,
    byStage,
    tasks,
    closingSoon,
}: Props) {
    const { auth, currency } = usePage().props;
    const money = (n: number | string) => formatMoney(n, currency);
    const max = Math.max(1, ...byStage.map((s) => s.amount));

    return (
        <>
            <Head title={t('Dashboard')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Good to see you, :name', {
                            name: auth.user.name.split(' ')[0],
                        })}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("Your pipeline, open tasks and this month's wins.")}
                    </p>
                </div>

                <section
                    aria-label={t('This month')}
                    className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4"
                >
                    <Stat
                        label={t('Open pipeline')}
                        value={money(stats.openAmount)}
                        note={t(':count open deals', {
                            count: stats.openCount,
                        })}
                    />
                    <Stat
                        label={t('Weighted pipeline')}
                        value={money(stats.weightedAmount)}
                        note={t('Amount × stage probability')}
                    />
                    <Stat
                        label={t('Won this month')}
                        value={money(stats.wonAmount)}
                        note={
                            stats.winRate === null
                                ? t(':count won', { count: stats.wonCount })
                                : t(':count won · :rate% win rate', {
                                      count: stats.wonCount,
                                      rate: stats.winRate,
                                  })
                        }
                        accent
                    />
                    <Stat
                        label={t('New leads this month')}
                        value={String(stats.newLeads)}
                        note={t('Added since the 1st')}
                    />
                </section>

                <div className="grid gap-6 lg:grid-cols-5">
                    <section className="flex flex-col gap-4 border bg-card p-5 lg:col-span-3">
                        <Header
                            title={t('Open pipeline by stage')}
                            href={deals()}
                            link={t('Board')}
                        />
                        {byStage.every((s) => s.count === 0) ? (
                            <p className="py-8 text-center text-muted-foreground">
                                {t('No open deals yet.')}
                            </p>
                        ) : (
                            <ol className="flex flex-col gap-3">
                                {byStage.map((s) => (
                                    <li
                                        key={s.id}
                                        className="grid grid-cols-[8rem_1fr] items-center gap-3"
                                        title={t(
                                            ':name: :count deals, :amount',
                                            {
                                                name: s.name,
                                                count: s.count,
                                                amount: money(s.amount),
                                            },
                                        )}
                                    >
                                        <span className="truncate text-sm">
                                            {s.name}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 flex-1 bg-muted">
                                                <div
                                                    className="h-full bg-linear-to-r from-chart-3 to-primary"
                                                    style={{
                                                        width: `${Math.max(s.amount > 0 ? 2 : 0, (s.amount / max) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="w-36 shrink-0 text-right font-mono text-sm tabular-nums">
                                                {money(s.amount)}
                                            </span>
                                            <span className="w-8 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">
                                                {s.count}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>

                    <section className="flex flex-col gap-4 border bg-card p-5 lg:col-span-2">
                        <Header
                            title={t('Due today or overdue')}
                            href={activities()}
                            link={t('My tasks')}
                        />
                        {tasks.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                {t('Nothing due. Nice.')}
                            </p>
                        ) : (
                            <ul className="flex flex-col divide-y">
                                {tasks.map((a) => (
                                    <li
                                        key={a.id}
                                        className="flex items-start gap-3 py-2.5"
                                    >
                                        <span className="pt-0.5">
                                            <DoneCheckbox activity={a} />
                                        </span>
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <ActivitySubject activity={a} />
                                            <span className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                                                <ActivityDue activity={a} />
                                                <ActivityRegarding
                                                    activity={a}
                                                />
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <section className="flex flex-col gap-4 border bg-card p-5">
                    <Header
                        title={t('Closing in the next 30 days')}
                        href={deals({
                            query: {
                                view: 'list',
                                sort: 'expected_close_date',
                            },
                        })}
                        link={t('All deals')}
                    />
                    {closingSoon.length === 0 ? (
                        <p className="py-6 text-center text-muted-foreground">
                            {t(
                                'No open deals expected to close in the next 30 days.',
                            )}
                        </p>
                    ) : (
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {closingSoon.map((d) => (
                                <li
                                    key={d.id}
                                    className="flex flex-col gap-1 border p-3"
                                >
                                    <Link
                                        href={showDeal(d.id)}
                                        className="font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                        {d.name}
                                    </Link>
                                    <span className="text-sm text-muted-foreground">
                                        {d.account?.name ?? t('No account')}
                                    </span>
                                    <span className="flex justify-between font-mono text-sm tabular-nums">
                                        <span>{money(d.amount)}</span>
                                        <span className="text-muted-foreground">
                                            {formatDate(d.expected_close_date)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

function Stat({
    label,
    value,
    note,
    accent = false,
}: {
    label: string;
    value: string;
    note: string;
    accent?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1 bg-card p-5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span
                className={
                    accent
                        ? 'font-mono text-2xl font-semibold text-primary tabular-nums'
                        : 'font-mono text-2xl font-semibold tabular-nums'
                }
            >
                {value}
            </span>
            <span className="text-sm text-muted-foreground">{note}</span>
        </div>
    );
}

function Header({
    title,
    href,
    link,
}: {
    title: string;
    href: Parameters<typeof Link>[0]['href'];
    link: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <Link
                href={href}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
                {link}
                <ArrowRightIcon className="size-3.5" />
            </Link>
        </div>
    );
}

Dashboard.layout = { breadcrumbs: [{ title: 'Dashboard', href: dashboard() }] };
