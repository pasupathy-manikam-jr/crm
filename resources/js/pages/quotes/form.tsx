import { DatePicker } from '@/components/date-picker';
import { Head, setLayoutProps, useForm, usePage } from '@inertiajs/react';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import QuoteController from '@/actions/App/Http/Controllers/QuoteController';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatMoney } from '@/lib/utils';
import { index, show } from '@/routes/quotes';
import type { ContactOption, Option, Product, Quote, QuoteItem } from '@/types';
import { t } from '@/lib/i18n';

type Props = {
    quote: Quote | null;
    prefill: {
        deal_id: number;
        account_id: number | null;
        contact_id: number | null;
    } | null;
    owners: Option[];
    accounts: Option[];
    contacts: ContactOption[];
    deals: (Option & { account_id: number | null })[];
    products: Product[];
};

const blankLine = (): QuoteItem => ({
    product_id: null,
    description: '',
    quantity: '1',
    unit_price: '',
    discount_percent: '0',
    tax_rate: '0',
});

/** The money on one line, in sen, the same way the server computes it. */
function lineCents(l: QuoteItem) {
    const gross = Math.round(
        Number(l.quantity || 0) * Number(l.unit_price || 0) * 100,
    );
    const discount = Math.round(
        (gross * Number(l.discount_percent || 0)) / 100,
    );
    const tax = Math.round(
        ((gross - discount) * Number(l.tax_rate || 0)) / 100,
    );

    return { gross, discount, tax, net: gross - discount };
}

export default function QuoteForm({
    quote,
    prefill,
    owners,
    accounts,
    contacts,
    deals,
    products,
}: Props) {
    const { auth, currency } = usePage().props;
    const money = (cents: number) => formatMoney(cents / 100, currency);
    const id = (v: number | null | undefined) => (v ? String(v) : 'none');

    const form = useForm({
        account_id: id(quote?.account_id ?? prefill?.account_id),
        contact_id: id(quote?.contact_id ?? prefill?.contact_id),
        deal_id: id(quote?.deal_id ?? prefill?.deal_id),
        valid_until:
            quote?.valid_until ??
            new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
        notes: quote?.notes ?? '',
        owner_id: String(quote?.owner_id ?? auth.user.id),
        items: quote?.items?.map((i) => ({
            ...i,
            quantity: String(Number(i.quantity)),
            discount_percent: String(Number(i.discount_percent)),
            tax_rate: String(Number(i.tax_rate)),
        })) ?? [blankLine()],
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Quotes', href: index() },
            ...(quote ? [{ title: quote.number, href: show(quote.id) }] : []),
            { title: quote ? 'Edit' : 'New quote', href: '#' },
        ],
    });

    const e = form.errors as Record<string, string | undefined>;
    const items = form.data.items;
    const setLine = (i: number, patch: Partial<QuoteItem>) =>
        form.setData(
            'items',
            items.map((l, n) => (n === i ? { ...l, ...patch } : l)),
        );
    const pickProduct = (i: number, productId: string) => {
        const p = products.find((x) => String(x.id) === productId);
        setLine(
            i,
            p
                ? {
                      product_id: p.id,
                      description: p.name,
                      unit_price: p.unit_price,
                      tax_rate: String(Number(p.tax_rate)),
                  }
                : { product_id: null },
        );
    };

    const totals = items.map(lineCents).reduce(
        (sum, c) => ({
            gross: sum.gross + c.gross,
            discount: sum.discount + c.discount,
            tax: sum.tax + c.tax,
        }),
        { gross: 0, discount: 0, tax: 0 },
    );
    const accountContacts = contacts.filter(
        (c) =>
            form.data.account_id === 'none' ||
            String(c.account_id) === form.data.account_id,
    );
    const accountDeals = deals.filter(
        (d) =>
            form.data.account_id === 'none' ||
            String(d.account_id) === form.data.account_id,
    );

    const submit = (ev: FormEvent) => {
        ev.preventDefault();

        if (quote) {
            form.put(QuoteController.update.url(quote.id), {
                preserveScroll: true,
            });
        } else {
            form.post(QuoteController.store.url(), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head
                title={
                    quote
                        ? t('Edit :name', { name: quote.number })
                        : t('New quote')
                }
            />
            <form
                noValidate
                onSubmit={submit}
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
            >
                <PageHeader
                    title={
                        quote
                            ? t('Edit :name', { name: quote.number })
                            : t('New quote')
                    }
                    description={t(
                        'Lines are priced in your currency; totals update as you type.',
                    )}
                >
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && (
                            <Spinner data-icon="inline-start" />
                        )}
                        {quote ? t('Save quote') : t('Create quote')}
                    </Button>
                </PageHeader>

                <section className="grid items-start gap-4 border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Picker
                        id="q-account"
                        label={t('Account')}
                        value={form.data.account_id}
                        options={accounts}
                        none={t('No account')}
                        error={e.account_id}
                        onChange={(v) =>
                            form.setData((d) => ({
                                ...d,
                                account_id: v,
                                contact_id: 'none',
                                deal_id: 'none',
                            }))
                        }
                    />
                    <Picker
                        id="q-contact"
                        label={t('Contact')}
                        value={form.data.contact_id}
                        options={accountContacts}
                        none={t('No contact')}
                        error={e.contact_id}
                        onChange={(v) => form.setData('contact_id', v)}
                    />
                    <Picker
                        id="q-deal"
                        label={t('Deal')}
                        value={form.data.deal_id}
                        options={accountDeals}
                        none={t('No deal')}
                        error={e.deal_id}
                        onChange={(v) => form.setData('deal_id', v)}
                    />
                    <Field data-invalid={e.valid_until ? true : undefined}>
                        <FieldLabel htmlFor="q-valid">
                            {t('Valid until')}
                        </FieldLabel>
                        <DatePicker
                            id="q-valid"
                            value={form.data.valid_until}
                            onChange={(v) => form.setData('valid_until', v)}
                            invalid={e.valid_until ? true : undefined}
                        />
                        <FieldError>{e.valid_until}</FieldError>
                    </Field>
                    <Picker
                        id="q-owner"
                        label={t('Owner')}
                        value={form.data.owner_id}
                        options={owners}
                        error={e.owner_id}
                        onChange={(v) => form.setData('owner_id', v)}
                    />
                </section>

                <section className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold">{t('Lines')}</h2>
                    {e.items && (
                        <p className="text-sm text-destructive">{e.items}</p>
                    )}
                    <div className="overflow-x-auto border bg-card">
                        <table className="w-full min-w-[56rem] text-sm">
                            <thead className="bg-muted text-left text-muted-foreground">
                                <tr>
                                    <th className="w-56 px-3 py-2 font-medium">
                                        {t('Product')}
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        {t('Description')}
                                    </th>
                                    <th className="w-24 px-3 py-2 text-right font-medium">
                                        {t('Qty')}
                                    </th>
                                    <th className="w-32 px-3 py-2 text-right font-medium">
                                        {t('Price')}
                                    </th>
                                    <th className="w-24 px-3 py-2 text-right font-medium">
                                        {t('Disc. %')}
                                    </th>
                                    <th className="w-24 px-3 py-2 text-right font-medium">
                                        {t('Tax %')}
                                    </th>
                                    <th className="w-36 px-3 py-2 text-right font-medium">
                                        {t('Net')}
                                    </th>
                                    <th className="w-12" />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((line, i) => {
                                    const err = (f: string) =>
                                        e[`items.${i}.${f}`];

                                    return (
                                        <tr
                                            key={i}
                                            className="border-t align-top"
                                        >
                                            <td className="px-3 py-2">
                                                <Select
                                                    value={
                                                        line.product_id
                                                            ? String(
                                                                  line.product_id,
                                                              )
                                                            : 'none'
                                                    }
                                                    onValueChange={(v) =>
                                                        pickProduct(i, v)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-label={t(
                                                            'Product for line :number',
                                                            { number: i + 1 },
                                                        )}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="none">
                                                                {t(
                                                                    'Custom line',
                                                                )}
                                                            </SelectItem>
                                                            {products.map(
                                                                (p) => (
                                                                    <SelectItem
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        value={String(
                                                                            p.id,
                                                                        )}
                                                                    >
                                                                        {p.name}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <Cell
                                                value={line.description}
                                                error={err('description')}
                                                label={t(
                                                    'Description, line :number',
                                                    {
                                                        number: i + 1,
                                                    },
                                                )}
                                                onChange={(v) =>
                                                    setLine(i, {
                                                        description: v,
                                                    })
                                                }
                                            />
                                            <Cell
                                                value={line.quantity}
                                                error={err('quantity')}
                                                label={t(
                                                    'Quantity, line :number',
                                                    {
                                                        number: i + 1,
                                                    },
                                                )}
                                                numeric
                                                onChange={(v) =>
                                                    setLine(i, { quantity: v })
                                                }
                                            />
                                            <Cell
                                                value={line.unit_price}
                                                error={err('unit_price')}
                                                label={t(
                                                    'Price, line :number',
                                                    {
                                                        number: i + 1,
                                                    },
                                                )}
                                                numeric
                                                onChange={(v) =>
                                                    setLine(i, {
                                                        unit_price: v,
                                                    })
                                                }
                                            />
                                            <Cell
                                                value={line.discount_percent}
                                                error={err('discount_percent')}
                                                label={t(
                                                    'Discount, line :number',
                                                    {
                                                        number: i + 1,
                                                    },
                                                )}
                                                numeric
                                                onChange={(v) =>
                                                    setLine(i, {
                                                        discount_percent: v,
                                                    })
                                                }
                                            />
                                            <Cell
                                                value={line.tax_rate}
                                                error={err('tax_rate')}
                                                label={t('Tax, line :number', {
                                                    number: i + 1,
                                                })}
                                                numeric
                                                onChange={(v) =>
                                                    setLine(i, { tax_rate: v })
                                                }
                                            />
                                            <td className="px-3 py-3.5 text-right font-mono tabular-nums">
                                                {money(lineCents(line).net)}
                                            </td>
                                            <td className="px-1 py-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    disabled={
                                                        items.length === 1
                                                    }
                                                    onClick={() =>
                                                        form.setData(
                                                            'items',
                                                            items.filter(
                                                                (_, n) =>
                                                                    n !== i,
                                                            ),
                                                        )
                                                    }
                                                    aria-label={t(
                                                        'Remove line :number',
                                                        {
                                                            number: i + 1,
                                                        },
                                                    )}
                                                >
                                                    <TrashIcon />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="self-start"
                        onClick={() =>
                            form.setData('items', [...items, blankLine()])
                        }
                    >
                        <PlusIcon data-icon="inline-start" />
                        {t('Add line')}
                    </Button>
                </section>

                <div className="grid items-start gap-6 lg:grid-cols-2">
                    <Field data-invalid={e.notes ? true : undefined}>
                        <FieldLabel htmlFor="q-notes">
                            {t('Notes and terms')}
                        </FieldLabel>
                        <Textarea
                            id="q-notes"
                            rows={4}
                            value={form.data.notes}
                            onChange={(ev) =>
                                form.setData('notes', ev.target.value)
                            }
                            placeholder={t(
                                "Payment terms, delivery, what's included…",
                            )}
                        />
                        <FieldError>{e.notes}</FieldError>
                    </Field>
                    <dl className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 border bg-card p-5 font-mono tabular-nums">
                        <dt className="font-sans text-muted-foreground">
                            {t('Subtotal')}
                        </dt>
                        <dd className="text-right">{money(totals.gross)}</dd>
                        <dt className="font-sans text-muted-foreground">
                            {t('Discount')}
                        </dt>
                        <dd className="text-right">
                            −{money(totals.discount)}
                        </dd>
                        <dt className="font-sans text-muted-foreground">
                            {t('Tax')}
                        </dt>
                        <dd className="text-right">{money(totals.tax)}</dd>
                        <dt className="border-t pt-2 font-sans font-semibold">
                            {t('Total')}
                        </dt>
                        <dd className="border-t pt-2 text-right text-lg font-semibold">
                            {money(totals.gross - totals.discount + totals.tax)}
                        </dd>
                    </dl>
                </div>
            </form>
        </>
    );
}

function Picker({
    id,
    label,
    value,
    options,
    none,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    options: Option[];
    none?: string;
    error?: string;
    onChange: (v: string) => void;
}) {
    return (
        <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={error ? true : undefined}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {none && <SelectItem value="none">{none}</SelectItem>}
                        {options.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <FieldError>{error}</FieldError>
        </Field>
    );
}

function Cell({
    value,
    error,
    label,
    numeric = false,
    onChange,
}: {
    value: string;
    error?: string;
    label: string;
    numeric?: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <td className="px-3 py-2">
            <Input
                value={value}
                inputMode={numeric ? 'decimal' : undefined}
                aria-label={label}
                aria-invalid={error ? true : undefined}
                className={cn(numeric && 'text-right font-mono tabular-nums')}
                onChange={(ev) => onChange(ev.target.value)}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </td>
    );
}
