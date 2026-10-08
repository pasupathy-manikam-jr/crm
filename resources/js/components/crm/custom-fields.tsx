import { usePage } from '@inertiajs/react';
import type { Column } from '@/components/data-table';
import {
    DateField,
    FilterSelect,
    SelectField,
    TextField,
} from '@/components/form-field';
import { FieldSeparator } from '@/components/ui/field';
import { formatDate } from '@/lib/utils';
import type { CustomFieldDef } from '@/types';
import { t } from '@/lib/i18n';

type Entity = CustomFieldDef['entity'];

/** The active custom fields for a record type. */
export function useCustomFields(entity: Entity): CustomFieldDef[] {
    return usePage().props.customFields[entity] ?? [];
}

/** A stored value the way people read it. */
export function formatCustomValue(
    field: CustomFieldDef,
    value: unknown,
): string | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (field.type === 'checkbox') {
        return value ? t('Yes') : t('No');
    }

    if (field.type === 'date') {
        return formatDate(String(value as string));
    }

    return String(value as string | number);
}

/** Form inputs for a record's custom fields, posted as custom_fields[key]. */
export function CustomFieldInputs({
    entity,
    values,
    errors,
}: {
    entity: Entity;
    values?: Record<string, unknown> | null;
    errors: Record<string, string>;
}) {
    const fields = useCustomFields(entity);

    if (fields.length === 0) {
        return null;
    }

    const inputs = fields.map((f) => {
        const id = `custom-${f.key}`;
        const name = `custom_fields[${f.key}]`;
        const label = f.required ? `${f.label} *` : f.label;
        const error = errors[`custom_fields.${f.key}`];
        const value = values?.[f.key];

        if (f.type === 'select' || f.type === 'checkbox') {
            const options =
                f.type === 'checkbox'
                    ? [
                          { value: '1', label: t('Yes') },
                          { value: '0', label: t('No') },
                      ]
                    : (f.options ?? []).map((o) => ({ value: o, label: o }));
            const current =
                f.type === 'checkbox'
                    ? value === undefined || value === null
                        ? null
                        : value
                          ? '1'
                          : '0'
                    : ((value as string | undefined) ?? null);

            return (
                <SelectField
                    key={f.key}
                    id={id}
                    label={label}
                    name={name}
                    options={options}
                    noneLabel="—"
                    defaultValue={current}
                    error={error}
                />
            );
        }

        if (f.type === 'date') {
            return (
                <DateField
                    key={f.key}
                    id={id}
                    label={label}
                    name={name}
                    defaultValue={(value as string | null | undefined) ?? null}
                    error={error}
                />
            );
        }

        return (
            <TextField
                key={f.key}
                id={id}
                label={label}
                name={name}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                multiline={f.type === 'textarea'}
                defaultValue={
                    value === null || value === undefined
                        ? ''
                        : String(value as string | number)
                }
                error={error}
                className={f.type === 'textarea' ? 'sm:col-span-2' : undefined}
            />
        );
    });

    return (
        <>
            <FieldSeparator className="sm:col-span-2">
                {t('Additional details')}
            </FieldSeparator>
            {inputs}
        </>
    );
}

/** Label/value pairs for a record page's details. */
export function customDetailItems(
    fields: CustomFieldDef[],
    values?: Record<string, unknown> | null,
) {
    return fields.map((f) => ({
        label: f.label,
        value: formatCustomValue(f, values?.[f.key]),
    }));
}

/** List columns, one per custom field. */
export function customColumns<
    T extends { custom_fields?: Record<string, unknown> | null },
>(fields: CustomFieldDef[]): Column<T>[] {
    return fields.map((f) => ({
        key: `custom:${f.key}`,
        header: f.label,
        sortKey: `custom:${f.key}`,
        className:
            f.type === 'number' || f.type === 'date'
                ? 'font-mono tabular-nums'
                : undefined,
        cell: (row: T) => formatCustomValue(f, row.custom_fields?.[f.key]),
    }));
}

/**
 * A list filter for each dropdown and yes/no custom field, sent as cf_<key> (the
 * server's ListsRecords applies it).
 */
export function CustomFieldFilters({
    entity,
    filters,
    onChange,
}: {
    entity: Entity;
    filters: Record<string, string>;
    onChange: (changes: Record<string, string>) => void;
}) {
    return useCustomFields(entity)
        .filter((f) => f.type === 'select' || f.type === 'checkbox')
        .map((f) => (
            <FilterSelect
                key={f.key}
                label={f.label}
                value={filters[`cf_${f.key}`] ?? ''}
                allLabel={t('Any :field', {
                    field: f.label.toLowerCase(),
                })}
                options={
                    f.type === 'checkbox'
                        ? [
                              {
                                  value: '1',
                                  label: t(':field: yes', { field: f.label }),
                              },
                              {
                                  value: '0',
                                  label: t(':field: no', { field: f.label }),
                              },
                          ]
                        : (f.options ?? []).map((o) => ({
                              value: o,
                              label: o,
                          }))
                }
                onChange={(value) => onChange({ [`cf_${f.key}`]: value })}
            />
        ));
}
