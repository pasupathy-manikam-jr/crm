import { Head } from '@inertiajs/react';
import {
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import WorkflowRuleController from '@/actions/App/Http/Controllers/WorkflowRuleController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DataTable } from '@/components/data-table';
import { DatePicker } from '@/components/date-picker';
import { TextField } from '@/components/form-field';
import { ViewToggle } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Field,
    FieldError,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useViewMode } from '@/hooks/use-list-filters';
import { t } from '@/lib/i18n';
import { index } from '@/routes/workflows';
import type { Option } from '@/types';

type FieldDef = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: Option[];
    settable: boolean;
};
type ModuleDef = { label: string; fields: FieldDef[]; actions: string[] };
type Condition = { field: string; operator: string; value?: string | null };
type Action = {
    type: string;
    field?: string;
    value?: string;
    subject?: string;
    due_in_days?: string | null;
    to?: string;
    body?: string;
};
type Rule = {
    id: number;
    name: string;
    module: string;
    event: string;
    conditions: Condition[];
    actions: Action[];
    active: boolean;
    runs_count: number;
};

type Props = {
    rules: Rule[];
    modules: Record<string, ModuleDef>;
    events: Record<string, string>;
    operators: Record<string, string>;
    unary: string[];
};

const actionLabels: Record<string, string> = {
    set_field: 'Set a field',
    create_task: 'Create a task for the owner',
    send_email: 'Send an email',
    require_approval: 'Require manager approval',
};

const toOptions = [
    { value: 'owner', label: 'The record’s owner' },
    { value: 'record', label: 'The record’s email / contact' },
    { value: 'other', label: 'Another address' },
];

/** Rows keep a local id so React keeps inputs straight when one is removed. */
type Row<T> = T & { uid: number };
let nextUid = 1;
const withUid = <T,>(item: T): Row<T> => ({ ...item, uid: nextUid++ });

export default function Workflows({
    rules,
    modules,
    events,
    operators,
    unary,
}: Props) {
    const [editing, setEditing] = useState<Rule | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Rule | null>(null);
    const [layout, setLayout] = useViewMode('workflows');

    const fieldLabel = (module: string, key: string) =>
        modules[module]?.fields.find((f) => f.key === key)?.label ?? key;
    const valueLabel = (module: string, key: string, value?: string | null) =>
        modules[module]?.fields
            .find((f) => f.key === key)
            ?.options?.find((o) => o.value === value)?.label ??
        value ??
        '';

    const describeAction = (rule: Rule, a: Action) =>
        a.type === 'set_field'
            ? t('Set :field to :value', {
                  field: fieldLabel(rule.module, a.field ?? ''),
                  value: valueLabel(rule.module, a.field ?? '', a.value),
              })
            : a.type === 'create_task'
              ? t('Task: :subject', { subject: a.subject })
              : a.type === 'send_email'
                ? a.to === 'owner'
                    ? t('Email owner: :subject', { subject: a.subject })
                    : a.to === 'record'
                      ? t('Email contact: :subject', { subject: a.subject })
                      : t('Email :to: :subject', {
                            to: a.to,
                            subject: a.subject,
                        })
                : t(actionLabels[a.type]);

    return (
        <>
            <Head title={t('Workflows')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Workflows')}
                    description={t(
                        'Rules that act when records are created or changed: set fields, create tasks, send emails, or hold quotes for approval.',
                    )}
                >
                    <ViewToggle view={layout} onChange={setLayout} />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add rule')}
                    </Button>
                </PageHeader>

                <DataTable
                    view={layout}
                    columns={[
                        {
                            key: 'name',
                            header: t('Rule'),
                            hideable: false,
                            cell: (r) => (
                                <button
                                    type="button"
                                    onClick={() => setEditing(r)}
                                    className="text-left font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    {r.name}
                                </button>
                            ),
                        },
                        {
                            key: 'when',
                            header: t('When'),
                            cell: (r) =>
                                t(':module :event', {
                                    module:
                                        modules[r.module]?.label ?? r.module,
                                    event: events[r.event],
                                }),
                        },
                        {
                            key: 'if',
                            header: t('If'),
                            cell: (r) =>
                                r.conditions.length === 0 ? (
                                    <span className="text-muted-foreground">
                                        {t('Always')}
                                    </span>
                                ) : (
                                    r.conditions
                                        .map((c) =>
                                            unary.includes(c.operator)
                                                ? t(':field :operator', {
                                                      field: fieldLabel(
                                                          r.module,
                                                          c.field,
                                                      ),
                                                      operator:
                                                          operators[c.operator],
                                                  })
                                                : t(':field :operator :value', {
                                                      field: fieldLabel(
                                                          r.module,
                                                          c.field,
                                                      ),
                                                      operator:
                                                          operators[c.operator],
                                                      value: valueLabel(
                                                          r.module,
                                                          c.field,
                                                          c.value,
                                                      ),
                                                  }),
                                        )
                                        .reduce((first, second) =>
                                            t(':first and :second', {
                                                first,
                                                second,
                                            }),
                                        )
                                ),
                        },
                        {
                            key: 'then',
                            header: t('Then'),
                            cell: (r) => (
                                <ul className="flex flex-col gap-0.5">
                                    {r.actions.map((a, i) => (
                                        <li key={i}>{describeAction(r, a)}</li>
                                    ))}
                                </ul>
                            ),
                        },
                        {
                            key: 'runs',
                            header: t('Runs'),
                            className: 'text-right font-mono tabular-nums',
                            cell: (r) => r.runs_count,
                        },
                        {
                            key: 'active',
                            header: t('Status'),
                            cell: (r) =>
                                r.active ? (
                                    <Badge variant="success">
                                        {t('Active')}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        {t('Off')}
                                    </Badge>
                                ),
                        },
                    ]}
                    rows={rules}
                    rowKey={(r) => r.id}
                    empty={t(
                        'No rules yet. Add one, e.g. “when a quote is saved and discount % is more than 15, require manager approval”.',
                    )}
                    actions={(r) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEditing(r)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(r)}
                            >
                                <TrashIcon />
                                {t('Delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                />
            </div>

            <RuleDialog
                key={editing === 'new' ? 'new' : (editing?.id ?? 'closed')}
                rule={editing}
                modules={modules}
                operators={operators}
                unary={unary}
                onClose={() => setEditing(null)}
            />
            <ConfirmDeleteDialog
                form={
                    deleting && WorkflowRuleController.destroy.form(deleting.id)
                }
                title={t('Delete “:name”?', { name: deleting?.name })}
                description={t(
                    'The rule stops running. Changes it already made stay.',
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

function RuleDialog({
    rule,
    modules,
    operators,
    unary,
    onClose,
}: Omit<Props, 'rules' | 'events'> & {
    rule: Rule | 'new' | null;
    onClose: () => void;
}) {
    const existing = rule !== 'new' ? rule : null;
    const [module, setModule] = useState(existing?.module ?? 'lead');
    const [conditions, setConditions] = useState<Row<Condition>[]>(
        (existing?.conditions ?? []).map(withUid),
    );
    const [actions, setActions] = useState<Row<Action>[]>(
        (existing?.actions ?? [{ type: '' }]).map(withUid),
    );
    const def = modules[module];
    const fieldOf = (key?: string) => def?.fields.find((f) => f.key === key);

    const update = <T,>(
        set: React.Dispatch<React.SetStateAction<Row<T>[]>>,
        uid: number,
        patch: Partial<T>,
    ) =>
        set((rows) =>
            rows.map((r) => (r.uid === uid ? { ...r, ...patch } : r)),
        );

    return (
        <RecordFormDialog
            open={rule !== null}
            title={
                existing
                    ? t('Edit “:name”', { name: existing.name })
                    : t('Add rule')
            }
            description={t(
                'When the record matches every condition, the actions run in order. Text can include {field} values, {owner} and {url}.',
            )}
            form={
                existing
                    ? WorkflowRuleController.update.form(existing.id)
                    : WorkflowRuleController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save rule') : t('Add rule')}
            contentClassName="sm:max-w-3xl"
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="rule-name"
                        label={t('Name')}
                        name="name"
                        defaultValue={existing?.name}
                        error={errors.name}
                        autoComplete="off"
                    />
                    <div className="grid gap-5 sm:grid-cols-3">
                        <Pick
                            id="rule-module"
                            label={t('When a')}
                            name="module"
                            value={module}
                            options={Object.entries(modules).map(
                                ([value, m]) => ({ value, label: m.label }),
                            )}
                            onChange={(m) => {
                                setModule(m);
                                setConditions([]);
                                setActions([withUid({ type: '' })]);
                            }}
                            error={errors.module}
                        />
                        <Pick
                            id="rule-event"
                            label={t('Is')}
                            name="event"
                            defaultValue={existing?.event ?? 'created'}
                            options={[
                                { value: 'created', label: t('created') },
                                { value: 'updated', label: t('updated') },
                                {
                                    value: 'saved',
                                    label: t('created or updated'),
                                },
                            ]}
                            error={errors.event}
                        />
                        <Pick
                            id="rule-active"
                            label={t('Status')}
                            name="active"
                            defaultValue={
                                existing?.active === false ? '0' : '1'
                            }
                            options={[
                                { value: '1', label: t('Active') },
                                { value: '0', label: t('Off') },
                            ]}
                        />
                    </div>

                    <FieldSet>
                        <FieldLegend variant="label">
                            {t('If (all must match)')}
                        </FieldLegend>
                        {conditions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                {t('No conditions: runs for every record.')}
                            </p>
                        )}
                        {conditions.map((c, i) => {
                            const field = fieldOf(c.field);
                            const err = (k: string) =>
                                errors[`conditions.${i}.${k}`];

                            return (
                                <div
                                    key={c.uid}
                                    className="grid items-start gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                                >
                                    <Pick
                                        id={`cond-${c.uid}-field`}
                                        label={t('Field')}
                                        srOnlyLabel
                                        name={`conditions[${i}][field]`}
                                        value={c.field}
                                        placeholder={t('Field')}
                                        options={(def?.fields ?? []).map(
                                            (f) => ({
                                                value: f.key,
                                                label: f.label,
                                            }),
                                        )}
                                        onChange={(v) =>
                                            update(setConditions, c.uid, {
                                                field: v,
                                                value: '',
                                            })
                                        }
                                        error={err('field')}
                                    />
                                    <Pick
                                        id={`cond-${c.uid}-op`}
                                        label={t('Test')}
                                        srOnlyLabel
                                        name={`conditions[${i}][operator]`}
                                        value={c.operator}
                                        options={Object.entries(operators).map(
                                            ([value, label]) => ({
                                                value,
                                                label,
                                            }),
                                        )}
                                        onChange={(v) =>
                                            update(setConditions, c.uid, {
                                                operator: v,
                                            })
                                        }
                                        error={err('operator')}
                                    />
                                    {unary.includes(c.operator) ? (
                                        <span />
                                    ) : (
                                        <ValueInput
                                            id={`cond-${c.uid}-value`}
                                            name={`conditions[${i}][value]`}
                                            field={field}
                                            value={c.value ?? ''}
                                            onChange={(v) =>
                                                update(setConditions, c.uid, {
                                                    value: v,
                                                })
                                            }
                                            error={err('value')}
                                        />
                                    )}
                                    <RemoveButton
                                        label={t('Remove condition')}
                                        onClick={() =>
                                            setConditions((rows) =>
                                                rows.filter(
                                                    (r) => r.uid !== c.uid,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                            );
                        })}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="self-start"
                            onClick={() =>
                                setConditions((rows) => [
                                    ...rows,
                                    withUid({
                                        field: '',
                                        operator: 'equals',
                                        value: '',
                                    }),
                                ])
                            }
                        >
                            <PlusIcon data-icon="inline-start" />
                            {t('Add condition')}
                        </Button>
                    </FieldSet>

                    <FieldSet>
                        <FieldLegend variant="label">{t('Then')}</FieldLegend>
                        <FieldError>{errors.actions}</FieldError>
                        {actions.map((a, i) => {
                            const err = (k: string) =>
                                errors[`actions.${i}.${k}`];
                            const toMode =
                                a.to === undefined ||
                                a.to === 'owner' ||
                                a.to === 'record'
                                    ? (a.to ?? 'owner')
                                    : 'other';

                            return (
                                <div
                                    key={a.uid}
                                    className="flex flex-col gap-2 border bg-muted/30 p-3"
                                >
                                    <div className="flex items-start gap-2">
                                        <Pick
                                            id={`act-${a.uid}-type`}
                                            label={t('Action')}
                                            srOnlyLabel
                                            name={`actions[${i}][type]`}
                                            value={a.type}
                                            placeholder={t('Choose an action')}
                                            options={(def?.actions ?? []).map(
                                                (type) => ({
                                                    value: type,
                                                    label: t(
                                                        actionLabels[type],
                                                    ),
                                                }),
                                            )}
                                            onChange={(v) =>
                                                update(setActions, a.uid, {
                                                    type: v,
                                                })
                                            }
                                            error={err('type')}
                                            className="flex-1"
                                        />
                                        <RemoveButton
                                            label={t('Remove action')}
                                            onClick={() =>
                                                setActions((rows) =>
                                                    rows.filter(
                                                        (r) => r.uid !== a.uid,
                                                    ),
                                                )
                                            }
                                        />
                                    </div>

                                    {a.type === 'set_field' && (
                                        <div className="grid items-start gap-2 sm:grid-cols-2">
                                            <Pick
                                                id={`act-${a.uid}-field`}
                                                label={t('Field')}
                                                name={`actions[${i}][field]`}
                                                value={a.field ?? ''}
                                                placeholder={t('Field')}
                                                options={(def?.fields ?? [])
                                                    .filter((f) => f.settable)
                                                    .map((f) => ({
                                                        value: f.key,
                                                        label: f.label,
                                                    }))}
                                                onChange={(v) =>
                                                    update(setActions, a.uid, {
                                                        field: v,
                                                        value: '',
                                                    })
                                                }
                                                error={err('field')}
                                            />
                                            <ValueInput
                                                id={`act-${a.uid}-value`}
                                                label={t('To')}
                                                name={`actions[${i}][value]`}
                                                field={fieldOf(a.field)}
                                                value={a.value ?? ''}
                                                onChange={(v) =>
                                                    update(setActions, a.uid, {
                                                        value: v,
                                                    })
                                                }
                                                error={err('value')}
                                            />
                                        </div>
                                    )}

                                    {a.type === 'create_task' && (
                                        <div className="grid items-start gap-2 sm:grid-cols-[1fr_10rem]">
                                            <TextField
                                                id={`act-${a.uid}-subject`}
                                                label={t('Task')}
                                                name={`actions[${i}][subject]`}
                                                defaultValue={a.subject}
                                                placeholder={t(
                                                    'Call {first_name}',
                                                )}
                                                error={err('subject')}
                                            />
                                            <TextField
                                                id={`act-${a.uid}-due`}
                                                label={t('Due in (days)')}
                                                name={`actions[${i}][due_in_days]`}
                                                inputMode="numeric"
                                                defaultValue={
                                                    a.due_in_days ?? ''
                                                }
                                                error={err('due_in_days')}
                                            />
                                        </div>
                                    )}

                                    {a.type === 'send_email' && (
                                        <>
                                            <div className="grid items-start gap-2 sm:grid-cols-2">
                                                <Pick
                                                    id={`act-${a.uid}-tomode`}
                                                    label={t('To')}
                                                    value={toMode}
                                                    options={toOptions.map(
                                                        (o) => ({
                                                            ...o,
                                                            label: t(o.label),
                                                        }),
                                                    )}
                                                    onChange={(v) =>
                                                        update(
                                                            setActions,
                                                            a.uid,
                                                            {
                                                                to:
                                                                    v ===
                                                                    'other'
                                                                        ? ''
                                                                        : v,
                                                            },
                                                        )
                                                    }
                                                />
                                                {toMode === 'other' ? (
                                                    <TextField
                                                        id={`act-${a.uid}-to`}
                                                        label={t('Address')}
                                                        name={`actions[${i}][to]`}
                                                        type="email"
                                                        value={a.to ?? ''}
                                                        onChange={(e) =>
                                                            update(
                                                                setActions,
                                                                a.uid,
                                                                {
                                                                    to: e.target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                        error={err('to')}
                                                    />
                                                ) : (
                                                    <input
                                                        type="hidden"
                                                        name={`actions[${i}][to]`}
                                                        value={toMode}
                                                    />
                                                )}
                                            </div>
                                            <TextField
                                                id={`act-${a.uid}-esubject`}
                                                label={t('Subject')}
                                                name={`actions[${i}][subject]`}
                                                defaultValue={a.subject}
                                                error={err('subject')}
                                            />
                                            <TextField
                                                id={`act-${a.uid}-body`}
                                                label={t('Message')}
                                                name={`actions[${i}][body]`}
                                                multiline
                                                defaultValue={a.body}
                                                error={err('body')}
                                            />
                                        </>
                                    )}

                                    {a.type === 'require_approval' && (
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'The quote waits in “Pending approval” until an admin or a sales manager of the owner’s team approves or rejects it. Editing an approved quote asks again.',
                                            )}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="self-start"
                            onClick={() =>
                                setActions((rows) => [
                                    ...rows,
                                    withUid({ type: '' }),
                                ])
                            }
                        >
                            <PlusIcon data-icon="inline-start" />
                            {t('Add action')}
                        </Button>
                    </FieldSet>
                </>
            )}
        </RecordFormDialog>
    );
}

/** A labelled select, controlled (value + onChange) or not (defaultValue); posts `name` when given. */
function Pick({
    id,
    label,
    name,
    value,
    defaultValue,
    options,
    placeholder,
    onChange,
    error,
    srOnlyLabel = false,
    className,
}: {
    id: string;
    label: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    options: Option[];
    placeholder?: string;
    onChange?: (value: string) => void;
    error?: string;
    srOnlyLabel?: boolean;
    className?: string;
}) {
    return (
        <Field data-invalid={error ? true : undefined} className={className}>
            <FieldLabel
                htmlFor={id}
                className={srOnlyLabel ? 'sr-only' : undefined}
            >
                {label}
            </FieldLabel>
            <Select
                name={name}
                value={value === undefined ? undefined : value || undefined}
                defaultValue={defaultValue}
                onValueChange={onChange}
            >
                <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={error ? true : undefined}
                >
                    <SelectValue placeholder={placeholder} />
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
            <FieldError>{error}</FieldError>
        </Field>
    );
}

/** The value box for a field: its options, a number, a date, or text. */
function ValueInput({
    id,
    label,
    name,
    field,
    value,
    onChange,
    error,
}: {
    id: string;
    /** Shown above the box; without it the label is for screen readers only. */
    label?: string;
    name: string;
    field?: FieldDef;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    if (field?.type === 'select') {
        return (
            <Pick
                id={id}
                label={label ?? t('Value')}
                srOnlyLabel={!label}
                name={name}
                value={value}
                placeholder={t('Value')}
                options={field.options ?? []}
                onChange={onChange}
                error={error}
            />
        );
    }

    if (field?.type === 'date') {
        return (
            <Field data-invalid={error ? true : undefined}>
                <FieldLabel
                    htmlFor={id}
                    className={label ? undefined : 'sr-only'}
                >
                    {label ?? t('Value')}
                </FieldLabel>
                <DatePicker
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    invalid={error ? true : undefined}
                />
                <FieldError>{error}</FieldError>
            </Field>
        );
    }

    return (
        <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={id} className={label ? undefined : 'sr-only'}>
                {label ?? t('Value')}
            </FieldLabel>
            <Input
                id={id}
                name={name}
                placeholder={t('Value')}
                inputMode={field?.type === 'number' ? 'decimal' : undefined}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={error ? true : undefined}
            />
            <FieldError>{error}</FieldError>
        </Field>
    );
}

function RemoveButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={onClick}
        >
            <XIcon />
        </Button>
    );
}

Workflows.layout = { breadcrumbs: [{ title: 'Workflows', href: index() }] };
