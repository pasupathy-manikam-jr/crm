import { Link, usePage } from '@inertiajs/react';
import { CaretDownIcon, ListIcon } from '@phosphor-icons/react';
import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CommandMenu } from '@/components/command-menu';
import { LanguagePicker } from '@/components/language-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { useNavItems } from '@/hooks/use-nav-items';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem } from '@/types';
import { t } from '@/lib/i18n';

/**
 * Ledger top bar: logo, sections as underlined tabs, admin menu, ⌘K search and the
 * user menu. Phones get the sections in a slide-in sheet.
 */
export function AppHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();
    const { main, admin } = useNavItems();
    const adminActive = admin.some((item) => isCurrentUrl(item.href));

    return (
        <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-md after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-primary/45 after:to-transparent print:hidden">
            <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-4 px-4 md:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            aria-label={t('Open navigation')}
                        >
                            <ListIcon />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64">
                        <SheetHeader>
                            <SheetTitle>{t('Navigation')}</SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col gap-1 px-4">
                            {[...main, ...admin].map((item) => (
                                <MobileLink
                                    key={item.title}
                                    item={item}
                                    active={isCurrentUrl(item.href)}
                                />
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>

                <Link
                    href={dashboard()}
                    prefetch
                    className="flex items-center gap-2"
                >
                    <AppLogo />
                </Link>

                <nav
                    aria-label={t('Main')}
                    className="ml-4 hidden h-14 items-stretch gap-1 lg:flex"
                >
                    {main.map((item) => (
                        <Tab
                            key={item.title}
                            item={item}
                            active={isCurrentUrl(item.href)}
                        />
                    ))}
                    {admin.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(
                                    'relative flex items-center gap-1 px-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground 2xl:px-3',
                                    adminActive &&
                                        'text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary',
                                )}
                            >
                                {t('Admin')}
                                <CaretDownIcon className="size-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44">
                                <DropdownMenuGroup>
                                    {admin.map((item) => (
                                        <DropdownMenuItem
                                            key={item.title}
                                            asChild
                                        >
                                            <Link href={item.href}>
                                                {item.icon && <item.icon />}
                                                {t(item.title)}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <CommandMenu />
                    <LanguagePicker compact />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('Account menu')}
                            >
                                <Avatar className="size-7 rounded-sm">
                                    <AvatarImage
                                        src={auth.user.avatar}
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback className="rounded-sm bg-accent text-[11px] font-medium text-accent-foreground">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {breadcrumbs.length > 1 && (
                <div className="border-t">
                    <div className="mx-auto flex h-9 w-full max-w-[1400px] items-center px-4 text-xs md:px-6">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </header>
    );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
    return (
        <Link
            href={item.href}
            prefetch
            aria-current={active ? 'page' : undefined}
            className={cn(
                'relative flex items-center px-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none 2xl:px-3',
                active &&
                    'text-foreground after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:bg-primary 2xl:after:inset-x-3',
            )}
        >
            {t(item.title)}
            {!!item.badge && <NavBadge count={item.badge} />}
        </Link>
    );
}

/** Count beside a section, e.g. tasks due today or overdue. */
function NavBadge({ count }: { count: number }) {
    return (
        <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center bg-destructive px-1 font-mono text-[11px] font-medium text-white tabular-nums">
            {count}
        </span>
    );
}

function MobileLink({ item, active }: { item: NavItem; active: boolean }) {
    return (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex items-center gap-3 px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground',
                active && 'bg-accent text-accent-foreground',
            )}
        >
            {item.icon && <item.icon className="size-4" />}
            {t(item.title)}
            {!!item.badge && <NavBadge count={item.badge} />}
        </Link>
    );
}
