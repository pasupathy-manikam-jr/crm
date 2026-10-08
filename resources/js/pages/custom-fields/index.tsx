import { Head } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import FieldDefinitionController from '@/actions/App/Http/Controllers/FieldDefinitionController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import type { Column } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { SelectField, TextField } from '@/components/form-field';
import { FilterSelect } from '@/components/form-field';
import { ViewToggle } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useViewMode } from '@/hooks/use-list-filters';
import { index } from '@/routes/fields';
import type { CustomFieldDef, Option } from '@/types';
import { t } from '@/lib/i18n';

type Field = CustomFieldDef & { id: number; active: boolean };

export default function CustomFields({
    fields,
    types,
}: {
    fields: Field[];
    types: Option[];
}) {
    const entities: Option[] = [
        { value: 'account', label: t('Accounts') },
        { value: 'contact', label: t('Contacts') },
        { value: 'lead', label: t('Leads') },
        { value: 'deal', label: t('Deals') },
        { value: 'case', label: t('Cases') },
        { value: 'contract', label: t('Contracts') },
    ];
    const [layout, setLayout] = useViewMode('custom-fields');
    const [entity, setEntity] = useState('');
    const [editing, setEditing] = useState<Field | 'new' | null>(null);
    const [newType, setNewType] = useState('text');
    const [deleting, setDeleting] = useState<Field | null>(null);
    const existing = editing !== 'new' ? editing : null;
    const label = (opts: Option[], v: string) =>
        opts.find((o) => o.value === v)?.label ?? v;
    const type = existing?.type ?? newType;

    const columns: Column<Field>[] = [
        {
            key: 'label',
            header: t('Field'),
            hideable: false,
            cell: (f) => <span className="font-medium">{f.label}</span>,
        },
        {
            key: 'entity',
            header: t('On'),
            cell: (f) => label(entities, f.entity),
        },
        { key: 'type', header: t('Type'), cell: (f) => label(types, f.type) },
        {
            key: 'options',
            header: t('Choices'),
            cell: (f) => f.options?.join(', '),
        },
        {
            key: 'required',
            header: t('Required'),
            cell: (f) => (f.required ? t('Yes') : t('No')),
        },
        {
            key: 'active',
            header: t('Status'),
            cell: (f) =>
                f.active ? (
                    <Badge variant="success">{t('Active')}</Badge>
                ) : (
                    <Badge variant="secondary">{t('Inactive')}</Badge>
                ),
        },
        {
            key: 'key',
            header: t('Key'),
            className: 'font-mono text-muted-foreground',
            cell: (f) => f.key,
        },
    ];

    return (
        <>
            <Head title={t('Custom fields')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Custom fields')}
                    description={t(
                        'Extra fields on accounts, contacts, leads, deals, cases and contracts. They appear in forms, record pages, list columns and CSV files.',
                    )}
                >
                    <Button
                        onClick={() => {
                            setNewType('text');
                            setEditing('new');
                        }}
                    >
                        <PlusIcon data-icon="inline-start" />
                        {t('Add field')}
                    </Button>
                </PageHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <FilterSelect
                        label={t('Record type')}
                        value={entity}
                        allLabel={t('All record types')}
                        options={entities}
                        onChange={setEntity}
                    />
                    <ViewToggle
                        view={layout}
                        onChange={setLayout}
                        className="ml-auto"
                    />
                </div>

                <DataTable
                    view={layout}
                    columns={columns}
                    rows={fields.filter((f) => !entity || f.entity === entity)}
                    rowKey={(f) => f.id}
                    empty={t(
                        "No custom fields yet. Add one to capture something the standard fields don't.",
                    )}
                    actions={(f) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEditing(f)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(f)}
                            >
                                <TrashIcon />
                                {t('Delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                />
            </div>

            <RecordFormDialog
                open={editing !== null}
                title={
                    existing
                        ? t('Edit :name', { name: existing.label })
                        : t('Add field')
                }
                description={
                    existing
                        ? t(
                              'Record type and field type are fixed. Inactive hides it and keeps stored values; Delete (in the row menu) removes it and its values.',
                          )
                        : t(
                              'Choose where it goes and what kind of value it holds; neither can change later.',
                          )
                }
                form={
                    existing
                        ? FieldDefinitionController.update.form(existing.id)
                        : FieldDefinitionController.store.form()
                }
                formKey={existing?.id ?? 'new'}
                submitLabel={existing ? t('Save changes') : t('Add field')}
                twoColumns
                onClose={() => setEditing(null)}
            >
                {(errors) => (
                    <>
                        <TextField
                            id="field-label"
                            label={t('Label')}
                            name="label"
                            defaultValue={existing?.label}
                            error={errors.label}
                            className="sm:col-span-2"
                            autoComplete="off"
                        />
                        {existing ? (
                            <>
                                <TextField
                                    id="field-entity"
                                    label={t('On')}
                                    name="_entity"
                                    defaultValue={label(
                                        entities,
                                        existing.entity,
                                    )}
                                    disabled
                                />
                                <TextField
                                    id="field-type"
                                    label={t('Type')}
                                    name="_type"
                                    defaultValue={label(types, existing.type)}
                                    disabled
                                />
                            </>
                        ) : (
                            <>
                                <SelectField
                                    id="field-entity"
                                    label={t('On')}
                                    name="entity"
                                    options={entities}
                                    placeholder={t('Choose a record type')}
                                    error={errors.entity}
                                />
                                <SelectField
                                    id="field-type"
                                    label={t('Type')}
                                    name="type"
                                    options={types}
                                    defaultValue="text"
                                    onValueChange={setNewType}
                                    error={errors.type}
                                />
                            </>
                        )}
                        {type === 'select' && (
                            <TextField
                                id="field-options"
                                label={t('Choices (one per line)')}
                                name="options"
                                multiline
                                defaultValue={
                                    existing?.options?.join('\n') ?? ''
                                }
                                error={errors.options}
                                className="sm:col-span-2"
                            />
                        )}
                        <SelectField
                            id="field-required"
                            label={t('Required')}
                            name="required"
                            options={[
                                { value: 'no', label: t('Optional') },
                                { value: 'yes', label: t('Required') },
                            ]}
                            defaultValue={existing?.required ? 'yes' : 'no'}
                        />
                        <SelectField
                            id="field-active"
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
                    </>
                )}
            </RecordFormDialog>
            <ConfirmDeleteDialog
                form={
                    deleting &&
                    FieldDefinitionController.destroy.form(deleting.id)
                }
                title={t('Delete “:name”?', { name: deleting?.label })}
                description={t(
                    "The field and every value stored in it are removed from all records. This can't be undone. To hide it but keep the values, edit it and set it Inactive.",
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

CustomFields.layout = {
    breadcrumbs: [{ title: 'Custom fields', href: index() }],
};
