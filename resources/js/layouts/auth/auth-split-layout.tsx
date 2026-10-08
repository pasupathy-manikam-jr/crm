import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguagePicker } from '@/components/language-picker';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'];

/** When the riding deal card passes each stage (s), matching --animate-deal-ride. */
const stageDelays = [0.4, 1.05, 1.7, 2.35, 2.95];

function LogoTile({ className = 'size-10' }: { className?: string }) {
    return (
        <span
            className={cn(
                'flex items-center justify-center rounded-sm bg-primary text-primary-foreground',
                className,
            )}
        >
            <AppLogoIcon className="size-3/5 fill-current" />
        </span>
    );
}

/**
 * Sign-in and welcome pages: a forest-green ledger panel where one deal rides the
 * pipeline from Lead to Won on load (shown already won with reduced motion), and the
 * form on a card.
 */
export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <aside className="relative isolate hidden flex-col justify-between gap-12 overflow-hidden bg-hero p-12 pl-16 text-hero-muted lg:flex">
                {/* Ledger paper: ruled lines and a margin rule. */}
                <div
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,var(--hero-line)_39px,var(--hero-line)_40px)]"
                />
                <div
                    aria-hidden
                    className="absolute inset-y-0 left-10 -z-10 w-px bg-primary/50"
                />
                <div
                    aria-hidden
                    className="absolute -right-48 -bottom-56 -z-10 size-[40rem] rounded-full bg-hero-glow opacity-80 blur-3xl"
                />

                <Link
                    href={home()}
                    className="flex items-center gap-3 self-start rounded-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                    <LogoTile />
                    <span className="text-xl font-semibold tracking-tight text-hero-foreground">
                        {name}
                    </span>
                </Link>

                <div className="flex max-w-lg flex-col gap-5">
                    <p className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-hero-foreground 2xl:text-5xl">
                        {t(
                            'Every customer, from first enquiry to signed quote.',
                        )}
                    </p>
                    <p className="max-w-md text-lg leading-relaxed">
                        {t(
                            'Leads, deals, quotes, support cases and contracts for the whole team, in one shared record.',
                        )}
                    </p>
                </div>

                <figure aria-label={t('A deal moving from Lead to Won')}>
                    <div className="relative h-32">
                        <div className="absolute bottom-0 left-full w-64 -translate-x-full border border-hero-line bg-hero-foreground p-4 text-foreground shadow-2xl shadow-black/30 motion-safe:animate-deal-ride">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate font-semibold">
                                        {t('Fleet tracking rollout')}
                                    </span>
                                    <span className="truncate text-sm text-muted-foreground">
                                        Teraju Logistics
                                    </span>
                                </div>
                                <span className="grid shrink-0 text-xs font-medium [&>*]:col-start-1 [&>*]:row-start-1">
                                    <span className="invisible bg-info/12 px-1.5 py-0.5 text-info motion-safe:visible motion-safe:animate-pending-out">
                                        {t('Open')}
                                    </span>
                                    <span className="bg-success/12 px-1.5 py-0.5 text-success motion-safe:animate-won-in">
                                        {t('Won')}
                                    </span>
                                </span>
                            </div>
                            <span className="mt-3 block font-mono text-2xl font-semibold tracking-tight tabular-nums">
                                RM 48,000
                            </span>
                        </div>
                    </div>

                    <ol className="relative mt-5 flex justify-between before:absolute before:inset-x-1 before:top-[5px] before:h-px before:bg-hero-muted/25">
                        {stages.map((stage, i) => {
                            const won = i === stages.length - 1;

                            return (
                                <li
                                    key={stage}
                                    className="relative flex flex-col items-center gap-3 text-xs first:items-start last:items-end"
                                >
                                    <span
                                        style={{
                                            animationDelay: `${stageDelays[i]}s`,
                                        }}
                                        className={cn(
                                            'size-[11px] rounded-full border-2 border-primary bg-primary motion-safe:animate-stage-fill',
                                            won && 'ring-4 ring-primary/30',
                                        )}
                                    />
                                    <span
                                        className={
                                            won
                                                ? 'font-medium text-hero-foreground'
                                                : undefined
                                        }
                                    >
                                        {t(stage)}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </figure>
            </aside>

            <main className="relative flex items-center justify-center px-4 py-16 sm:px-8">
                <div className="absolute top-4 right-4 w-44">
                    <LanguagePicker />
                </div>
                <div className="flex w-full max-w-md flex-col gap-6">
                    <Link
                        href={home()}
                        className="flex items-center gap-3 self-start lg:hidden"
                    >
                        <LogoTile className="size-9" />
                        <span className="text-lg font-semibold tracking-tight">
                            {name}
                        </span>
                    </Link>
                    <div className="flex flex-col gap-8 border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
