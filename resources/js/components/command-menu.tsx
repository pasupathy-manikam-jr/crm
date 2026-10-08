import { router } from '@inertiajs/react';
import {
    AddressBookIcon,
    BuildingsIcon,
    CurrencyCircleDollarIcon,
    FileTextIcon,
    LifebuoyIcon,
    MagnifyingGlassIcon,
    TargetIcon,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import SearchController from '@/actions/App/Http/Controllers/SearchController';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from '@/components/ui/command';
import { useNavItems } from '@/hooks/use-nav-items';
import { toUrl } from '@/lib/utils';
import { index as accounts } from '@/routes/accounts';
import { index as cases } from '@/routes/cases';
import { index as contacts } from '@/routes/contacts';
import { index as contracts } from '@/routes/contracts';
import { index as deals } from '@/routes/deals';
import { index as leads } from '@/routes/leads';
import { t } from '@/lib/i18n';

type Result = {
    type: 'lead' | 'contact' | 'account' | 'deal' | 'case' | 'contract';
    id: number;
    title: string;
    subtitle: string | null;
    url: string;
};

const groups = [
    { type: 'lead', heading: 'Leads', icon: TargetIcon },
    { type: 'contact', heading: 'Contacts', icon: AddressBookIcon },
    { type: 'account', heading: 'Accounts', icon: BuildingsIcon },
    { type: 'deal', heading: 'Deals', icon: CurrencyCircleDollarIcon },
    { type: 'case', heading: 'Cases', icon: LifebuoyIcon },
    { type: 'contract', heading: 'Contracts', icon: FileTextIcon },
] as const;

const lists = [
    { label: 'Search deals for “:query”', url: () => deals.url() },
    { label: 'Search cases for “:query”', url: () => cases.url() },
    { label: 'Search contracts for “:query”', url: () => contracts.url() },
    { label: 'Search leads for “:query”', url: () => leads.url() },
    { label: 'Search accounts for “:query”', url: () => accounts.url() },
    { label: 'Search contacts for “:query”', url: () => contacts.url() },
];

/**
 * Ctrl/⌘K palette: records matching what's typed (names, emails, phones) across leads,
 * contacts, accounts and deals; list searches; and every section to jump to.
 */
export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(false);
    const { main, admin } = useNavItems();
    const q = query.trim();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Ask the server once typing pauses; a newer query cancels the one in flight.
    useEffect(() => {
        if (q.length < 2) {
            setResults([]);

            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
            setLoading(true);
            fetch(SearchController.url({ query: { q } }), {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            })
                .then((r) => (r.ok ? r.json() : { results: [] }))
                .then((data: { results: Result[] }) => setResults(data.results))
                .catch(() => {})
                .finally(() => setLoading(false));
        }, 200);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [q]);

    const go = (url: string, data?: Record<string, string>) => {
        setOpen(false);
        setQuery('');
        router.get(url, data);
    };

    const sections = [...main, ...admin].filter((item) =>
        t(item.title).toLowerCase().includes(q.toLowerCase()),
    );

    return (
        <>
            <Button
                variant="outline"
                className="w-9 justify-start text-muted-foreground sm:w-56 lg:w-9 2xl:w-56"
                onClick={() => setOpen(true)}
                aria-label={t('Search and jump')}
            >
                <MagnifyingGlassIcon data-icon="inline-start" />
                <span className="hidden sm:inline lg:hidden 2xl:inline">
                    {t('Search…')}
                </span>
                <kbd className="ml-auto hidden font-mono text-[10px] sm:inline lg:hidden 2xl:inline">
                    ⌘K
                </kbd>
            </Button>

            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                title={t('Search and jump')}
                description={t(
                    'Find any lead, contact, account, deal, case or contract by name, number, email or phone, or go to a section.',
                )}
                className="sm:max-w-xl"
            >
                {/* Matching happens on the server, so cmdk's own fuzzy filter is off. */}
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={t('Name, email, phone, or where to go…')}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {loading
                                ? t('Searching…')
                                : q.length < 2
                                  ? t('Type at least 2 characters.')
                                  : t('Nothing matches.')}
                        </CommandEmpty>
                        {groups.map((g) => {
                            const rows = results.filter(
                                (r) => r.type === g.type,
                            );

                            return (
                                rows.length > 0 && (
                                    <CommandGroup
                                        key={g.type}
                                        heading={t(g.heading)}
                                    >
                                        {rows.map((r) => (
                                            <CommandItem
                                                key={`${r.type}-${r.id}`}
                                                value={`${r.type}-${r.id}`}
                                                onSelect={() => go(r.url)}
                                            >
                                                <g.icon />
                                                <span className="truncate">
                                                    {r.title}
                                                </span>
                                                {r.subtitle && (
                                                    <span className="ml-auto truncate text-muted-foreground">
                                                        {r.subtitle}
                                                    </span>
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )
                            );
                        })}
                        {q.length >= 2 && (
                            <CommandGroup heading={t('Search a list')}>
                                {lists.map((s) => (
                                    <CommandItem
                                        key={s.label}
                                        value={`list-${s.label}`}
                                        onSelect={() =>
                                            go(s.url(), { search: q })
                                        }
                                    >
                                        <MagnifyingGlassIcon />
                                        {t(s.label, { query: q })}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {sections.length > 0 && (
                            <CommandGroup heading={t('Go to')}>
                                {sections.map((item) => (
                                    <CommandItem
                                        key={item.title}
                                        value={`go-${item.title}`}
                                        onSelect={() => go(toUrl(item.href))}
                                    >
                                        {item.icon && <item.icon />}
                                        {t(item.title)}
                                        {admin.includes(item) && (
                                            <CommandShortcut>
                                                {t('Admin')}
                                            </CommandShortcut>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    );
}
