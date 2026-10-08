import { Head, router, usePage } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import type { Column } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { SelectField, TextField } from '@/components/form-field';
import { ListPagination } from '@/components/list-pagination';
import { ViewToggle } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useViewMode } from '@/hooks/use-list-filters';
import { t } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils';
import { index } from '@/routes/products';
import type { Paginated, Product } from '@/types';

type Props = { products: Paginated<Product>; filters: { search: string } };

export default function Products({ products, filters }: Props) {
    const { currency } = usePage().props;
    const [layout, setLayout] = useViewMode('products');
    const [editing, setEditing] = useState<Product | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Product | null>(null);
    const existing = editing !== 'new' ? editing : null;

    const columns: Column<Product>[] = [
        {
            key: 'name',
            header: t('Product'),
            hideable: false,
            cell: (p) => <span className="font-medium">{p.name}</span>,
        },
        {
            key: 'sku',
            header: t('SKU'),
            className: 'font-mono',
            cell: (p) => p.sku,
        },
        {
            key: 'price',
            header: t('Price'),
            className: 'text-right font-mono tabular-nums',
            cell: (p) => formatMoney(p.unit_price, currency),
        },
        {
            key: 'tax',
            header: t('Tax'),
            className: 'text-right font-mono tabular-nums',
            cell: (p) => `${Number(p.tax_rate)}%`,
        },
        {
            key: 'active',
            header: t('Status'),
            cell: (p) =>
                p.active ? (
                    <Badge variant="success">{t('Active')}</Badge>
                ) : (
                    <Badge variant="secondary">{t('Inactive')}</Badge>
                ),
        },
    ];

    return (
        <>
            <Head title={t('Products')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Products')}
                    description={t(
                        'What you sell. Active products can be picked onto quote lines.',
                    )}
                >
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add product')}
                    </Button>
                </PageHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <form
                        role="search"
                        className="w-full sm:max-w-xs"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const search = (
                                e.currentTarget.elements.namedItem(
                                    'search',
                                ) as HTMLInputElement
                            ).value;
                            router.get(index.url(), search ? { search } : {}, {
                                preserveState: true,
                            });
                        }}
                    >
                        <Input
                            name="search"
                            type="search"
                            defaultValue={filters.search}
                            placeholder={t('Search name or SKU')}
                            aria-label={t('Search products')}
                        />
                    </form>
                    <ViewToggle
                        view={layout}
                        onChange={setLayout}
                        className="ml-auto"
                    />
                </div>

                <DataTable
                    view={layout}
                    columns={columns}
                    rows={products.data}
                    rowKey={(p) => p.id}
                    empty={t(
                        'No products yet. Add what you sell so it can go on quotes.',
                    )}
                    actions={(p) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEditing(p)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(p)}
                            >
                                <TrashIcon />
                                {t('Delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                />
                <ListPagination page={products} />
            </div>

            <RecordFormDialog
                open={editing !== null}
                title={
                    existing
                        ? t('Edit :name', { name: existing.name })
                        : t('Add product')
                }
                description={t(
                    'Price and tax are copied onto a quote line when the product is picked; you can still change them per quote.',
                )}
                form={
                    existing
                        ? ProductController.update.form(existing.id)
                        : ProductController.store.form()
                }
                formKey={existing?.id ?? 'new'}
                submitLabel={existing ? t('Save changes') : t('Add product')}
                twoColumns
                onClose={() => setEditing(null)}
            >
                {(errors) => (
                    <>
                        <TextField
                            id="product-name"
                            label={t('Name')}
                            name="name"
                            defaultValue={existing?.name}
                            error={errors.name}
                            className="sm:col-span-2"
                            autoComplete="off"
                        />
                        <TextField
                            id="product-sku"
                            label={t('SKU')}
                            name="sku"
                            defaultValue={existing?.sku ?? ''}
                            error={errors.sku}
                        />
                        <SelectField
                            id="product-active"
                            label={t('Status')}
                            name="active"
                            options={[
                                { value: 'active', label: t('Active') },
                                { value: 'inactive', label: t('Inactive') },
                            ]}
                            defaultValue={
                                existing && !existing.active
                                    ? 'inactive'
                                    : 'active'
                            }
                        />
                        <TextField
                            id="product-price"
                            label={t('Price (:currency)', { currency })}
                            name="unit_price"
                            inputMode="decimal"
                            defaultValue={existing?.unit_price ?? ''}
                            error={errors.unit_price}
                        />
                        <TextField
                            id="product-tax"
                            label={t('Tax rate (%)')}
                            name="tax_rate"
                            inputMode="decimal"
                            defaultValue={
                                existing
                                    ? String(Number(existing.tax_rate))
                                    : '0'
                            }
                            error={errors.tax_rate}
                        />
                        <TextField
                            id="product-description"
                            label={t('Description')}
                            name="description"
                            multiline
                            defaultValue={existing?.description ?? ''}
                            error={errors.description}
                            className="sm:col-span-2"
                        />
                    </>
                )}
            </RecordFormDialog>
            <ConfirmDeleteDialog
                form={deleting && ProductController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t(
                    'Existing quotes keep their lines. To stop offering it but keep it on record, set it Inactive instead.',
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Products.layout = { breadcrumbs: [{ title: 'Products', href: index() }] };
