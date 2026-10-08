import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircleIcon, GitMergeIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import DuplicateController from '@/actions/App/Http/Controllers/DuplicateController';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/lib/i18n';
import { cn, formatDate } from '@/lib/utils';

type Type = 'accounts' | 'contacts' | 'leads';
type Row = Record<string, unknown> & {
    id: number;
    owner: { name: string } | null;
    created_at: string;
};

/** Whole sentences per record type, so each translates as one key. */
const titles: Record<Type, string> = {
    accounts: 'Duplicate accounts',
    contacts: 'Duplicate contacts',
    leads: 'Duplicate leads',
};
const backLabels: Record<Type, string> = {
    accounts: 'Back to accounts',
    contacts: 'Back to contacts',
    leads: 'Back to leads',
};
const noneShared: Record<Type, string> = {
    accounts: 'None of your accounts share an email, phone number or name.',
    contacts: 'None of your contacts share an email, phone number or name.',
    leads: 'None of your leads share an email, phone number or name.',
};
const keptNotes: Record<Type, string> = {
    accounts:
        'Highlighted values are kept. Activities, notes, files, contacts, deals and quotes move to the kept record; the others are deleted.',
    contacts:
        'Highlighted values are kept. Activities, notes, files, deals and quotes move to the kept record; the others are deleted.',
    leads: 'Highlighted values are kept. Activities, notes, files move to the kept record; the others are deleted.',
};
const label = (field: string) =>
    field === 'account_id'
        ? 'Account'
        : field.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default function Duplicates({
    type,
    groups,
    fields,
    accounts,
}: {
    type: Type;
    groups: Row[][];
    fields: string[];
    accounts: Record<string, string>;
}) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    return (
        <>
            <Head title={t(titles[type])} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t(titles[type])}
                    description={t(
                        'Records with the same email, phone or name. Pick the one to keep and which value to use for each field; everything linked to the others moves to it.',
                    )}
                >
                    <Button variant="outline" asChild>
                        <Link href={`/${type}`}>{t(backLabels[type])}</Link>
                    </Button>
                </PageHeader>

                {errors.merge && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.merge}</AlertDescription>
                    </Alert>
                )}

                {groups.length === 0 ? (
                    <Empty className="border border-dashed bg-card">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <CheckCircleIcon />
                            </EmptyMedia>
                            <EmptyTitle>{t('No duplicates found')}</EmptyTitle>
                            <EmptyDescription>
                                {t(noneShared[type])}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    groups.map((group) => (
                        <Group
                            key={group.map((r) => r.id).join('-')}
                            type={type}
                            group={group}
                            fields={fields}
                            accounts={accounts}
                        />
                    ))
                )}
            </div>
        </>
    );
}

function Group({
    type,
    group,
    fields,
    accounts,
}: {
    type: Type;
    group: Row[];
    fields: string[];
    accounts: Record<string, string>;
}) {
    const [survivor, setSurvivor] = useState(group[0].id);
    // Per field, the record whose value is kept: the first record that has one.
    const [values, setValues] = useState<Record<string, number>>(() =>
        Object.fromEntries(
            fields.map((f) => [
                f,
                (group.find((r) => r[f] !== null && r[f] !== '') ?? group[0])
                    .id,
            ]),
        ),
    );
    const [merging, setMerging] = useState(false);

    const show = (field: string, v: unknown) => {
        if (v === null || v === undefined || v === '') {
            return (
                <span className="text-muted-foreground italic">
                    {t('empty')}
                </span>
            );
        }

        return field === 'account_id'
            ? (accounts[String(v as number)] ?? `#${String(v as number)}`)
            : String(v as string);
    };

    const merge = () =>
        router.post(
            DuplicateController.merge.url(type),
            { survivor_id: survivor, ids: group.map((r) => r.id), values },
            {
                onStart: () => setMerging(true),
                onFinish: () => setMerging(false),
            },
        );

    return (
        <section className="flex flex-col gap-3 border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">
                    {t(':count possible duplicates', { count: group.length })}
                </h2>
                <Button onClick={merge} disabled={merging}>
                    {merging ? (
                        <Spinner data-icon="inline-start" />
                    ) : (
                        <GitMergeIcon data-icon="inline-start" />
                    )}
                    {t('Merge into one')}
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-sm">
                    <thead>
                        <tr className="border-b text-left">
                            <th className="w-40 py-2 pr-3 font-medium text-muted-foreground">
                                {t('Keep')}
                            </th>
                            {group.map((r) => (
                                <th
                                    key={r.id}
                                    className="py-2 pr-3 font-normal"
                                >
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`keep-${group[0].id}`}
                                            checked={survivor === r.id}
                                            onChange={() => setSurvivor(r.id)}
                                            className="accent-primary"
                                        />
                                        <span
                                            className={cn(
                                                'font-medium',
                                                survivor === r.id &&
                                                    'text-primary',
                                            )}
                                        >
                                            {survivor === r.id
                                                ? t('Keep this one')
                                                : t('Merge into kept')}
                                        </span>
                                    </label>
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        {t(':owner · added :date', {
                                            owner: r.owner?.name,
                                            date: formatDate(r.created_at),
                                        })}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((f) => (
                            <tr key={f} className="border-b last:border-0">
                                <td className="py-2 pr-3 text-muted-foreground">
                                    {t(label(f))}
                                </td>
                                {group.map((r) => (
                                    <td key={r.id} className="py-1 pr-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setValues((v) => ({
                                                    ...v,
                                                    [f]: r.id,
                                                }))
                                            }
                                            aria-pressed={values[f] === r.id}
                                            className={cn(
                                                'w-full border px-2 py-1.5 text-left transition-colors hover:border-primary/50',
                                                values[f] === r.id
                                                    ? 'border-primary bg-accent'
                                                    : 'border-transparent',
                                            )}
                                        >
                                            {show(f, r[f])}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-muted-foreground">
                {t(keptNotes[type])}
            </p>
        </section>
    );
}
