import { DatePicker } from '@/components/date-picker';
import { Head, router, usePage } from '@inertiajs/react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { intlLocale, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils';
import { index } from '@/routes/reports';
import type { Option } from '@/types';

type Module = Option & {
    groups: Option[];
    measures: (Option & { money: boolean })[];
};
type Filters = {
    module: string;
    group: string;
    measure: string;
    from: string;
    to: string;
};
type Props = {
    modules: Module[];
    filters: Filters;
    rows: { label: string; value: number }[];
    total: number;
};

export default function Reports({ modules, filters, rows, total }: Props) {
    const { currency } = usePage().props;
    const module =
        modules.find((m) => m.value === filters.module) ?? modules[0];
    const measure =
        module.measures.find((m) => m.value === filters.measure) ??
        module.measures[0];
    const group =
        module.groups.find((g) => g.value === filters.group) ??
        module.groups[0];
    const fmt = (n: number) =>
        measure.money
            ? formatMoney(n, currency)
            : n.toLocaleString(intlLocale());
    const max = Math.max(1, ...rows.map((r) => r.value));

    const apply = (changes: Partial<Filters>) => {
        const next = { ...filters, ...changes };
        // A different record type has different groupings and measures; start from its defaults.
        const query = changes.module
            ? { module: changes.module, from: next.from, to: next.to }
            : next;
        router.get(
            index.url(),
            Object.fromEntries(Object.entries(query).filter(([, v]) => v)),
            { preserveScroll: true, preserveState: true },
        );
    };

    const csv = ReportController.index.url({
        query: {
            ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
            format: 'csv',
        },
    });

    return (
        <>
            <Head title={t('Reports')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Reports')}
                    description={t(
                        'Count or total any records, grouped the way you need. Only records you can see are included.',
                    )}
                >
                    <Button variant="outline" asChild>
                        <a href={csv}>
                            <DownloadSimpleIcon data-icon="inline-start" />
                            {t('Export CSV')}
                        </a>
                    </Button>
                </PageHeader>

                <section className="grid items-end gap-4 border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5">
                    <Picker
                        id="r-module"
                        label={t('Report on')}
                        value={module.value}
                        options={modules}
                        onChange={(v) => apply({ module: v })}
                    />
                    <Picker
                        id="r-group"
                        label={t('Group by')}
                        value={group.value}
                        options={module.groups}
                        onChange={(v) => apply({ group: v })}
                    />
                    <Picker
                        id="r-measure"
                        label={t('Show')}
                        value={measure.value}
                        options={module.measures}
                        onChange={(v) => apply({ measure: v })}
                    />
                    <Field>
                        <FieldLabel htmlFor="r-from">
                            {t('Added from')}
                        </FieldLabel>
                        <DatePicker
                            id="r-from"
                            value={filters.from}
                            onChange={(v) => apply({ from: v })}
                            placeholder={t('Any date')}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="r-to">{t('Added to')}</FieldLabel>
                        <DatePicker
                            id="r-to"
                            value={filters.to}
                            onChange={(v) => apply({ to: v })}
                            placeholder={t('Any date')}
                        />
                    </Field>
                </section>

                <section className="flex flex-col gap-4 border bg-card p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="font-semibold">
                            {t(':measure by :group', {
                                measure: measure.label,
                                group: group.label.toLowerCase(),
                            })}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {t('Total')}{' '}
                            <span className="font-mono font-semibold text-foreground tabular-nums">
                                {fmt(total)}
                            </span>
                        </span>
                    </div>
                    {rows.length === 0 ? (
                        <p className="py-10 text-center text-muted-foreground">
                            {t('No records match. Try a wider date range.')}
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-3 font-medium">
                                        {group.label}
                                    </th>
                                    <th className="hidden py-2 pr-3 font-medium sm:table-cell" />
                                    <th className="py-2 pr-3 text-right font-medium">
                                        {measure.label}
                                    </th>
                                    <th className="w-16 py-2 text-right font-medium">
                                        {t('Share')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr
                                        key={r.label}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-2 pr-3">{r.label}</td>
                                        <td className="hidden w-1/2 py-2 pr-3 sm:table-cell">
                                            <div className="h-5 bg-muted">
                                                <div
                                                    className="h-full bg-linear-to-r from-chart-3 to-primary"
                                                    style={{
                                                        width: `${Math.max(r.value > 0 ? 1.5 : 0, (r.value / max) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 pr-3 text-right font-mono tabular-nums">
                                            {fmt(r.value)}
                                        </td>
                                        <td className="py-2 text-right font-mono text-muted-foreground tabular-nums">
                                            {total
                                                ? `${Math.round((r.value / total) * 100)}%`
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </>
    );
}

function Picker({
    id,
    label,
    value,
    options,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    options: Option[];
    onChange: (v: string) => void;
}) {
    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {options.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </Field>
    );
}

Reports.layout = { breadcrumbs: [{ title: 'Reports', href: index() }] };
