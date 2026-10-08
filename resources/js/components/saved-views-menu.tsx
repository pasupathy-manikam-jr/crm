import { router, usePage } from '@inertiajs/react';
import {
    BookmarkSimpleIcon,
    CheckIcon,
    FloppyDiskIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import SavedViewController from '@/actions/App/Http/Controllers/SavedViewController';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';

const KEYS = ['search', 'owner', 'status', 'sort', 'direction', 'view', 'tab'];

/** Only the filters a view stores, without empty ones. */
function pick(filters: Record<string, string>) {
    return Object.fromEntries(
        Object.entries(filters).filter(
            ([k, v]) => KEYS.includes(k) && v !== '' && v != null,
        ),
    );
}

const same = (a: Record<string, string>, b: Record<string, string>) => {
    const ka = Object.keys(a).sort();

    return (
        ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k])
    );
};

/** "Views" menu on a list: apply, save or delete this user's named filter sets. */
export function SavedViewsMenu({
    list,
    url,
    filters,
}: {
    list: string;
    url: string;
    filters: Record<string, string>;
}) {
    const views = usePage().props.savedViews.filter((v) => v.list === list);
    const [saving, setSaving] = useState(false);
    const current = pick(filters);
    const active = views.find((v) => same(v.query, current));

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <BookmarkSimpleIcon data-icon="inline-start" />
                        {active ? active.name : t('Views')}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>{t('Saved views')}</DropdownMenuLabel>
                    <DropdownMenuGroup>
                        {views.length === 0 && (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                {t('None yet. Filter the list, then save it.')}
                            </p>
                        )}
                        {views.map((v) => (
                            <DropdownMenuItem
                                key={v.id}
                                onSelect={() => router.get(url, v.query)}
                                className="group"
                            >
                                {active?.id === v.id ? (
                                    <CheckIcon />
                                ) : (
                                    <span className="size-4" />
                                )}
                                <span className="flex-1 truncate">
                                    {v.name}
                                </span>
                                <button
                                    type="button"
                                    aria-label={t('Delete view :name', {
                                        name: v.name,
                                    })}
                                    className="opacity-50 hover:text-destructive hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.delete(
                                            SavedViewController.destroy.url(
                                                v.id,
                                            ),
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        );
                                    }}
                                >
                                    <TrashIcon />
                                </button>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => setSaving(true)}>
                            <FloppyDiskIcon />
                            {t('Save current view…')}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <RecordFormDialog
                open={saving}
                title={t('Save view')}
                description={t(
                    "Saves this list's current search, filters and sort under a name only you see. Saving an existing name replaces it.",
                )}
                form={SavedViewController.store.form()}
                formKey="save-view"
                submitLabel={t('Save view')}
                onClose={() => setSaving(false)}
            >
                {(errors) => (
                    <>
                        <input type="hidden" name="list" value={list} />
                        {Object.entries(current).map(([k, v]) => (
                            <input
                                key={k}
                                type="hidden"
                                name={`query[${k}]`}
                                value={v}
                            />
                        ))}
                        <TextField
                            id="view-name"
                            label={t('View name')}
                            name="name"
                            placeholder={t('e.g. My qualified leads')}
                            defaultValue={active?.name ?? ''}
                            error={errors.name}
                            autoComplete="off"
                        />
                    </>
                )}
            </RecordFormDialog>
        </>
    );
}
