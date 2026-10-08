import { Head, router } from '@inertiajs/react';
import {
    PaperPlaneTiltIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import WebhookController from '@/actions/App/Http/Controllers/WebhookController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DataTable } from '@/components/data-table';
import { SelectField, TextField } from '@/components/form-field';
import { ViewToggle } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useViewMode } from '@/hooks/use-list-filters';
import { formatDue } from '@/lib/utils';
import { index } from '@/routes/webhooks';
import { t } from '@/lib/i18n';

type Webhook = {
    id: number;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
    last_status: number | null;
    last_error: string | null;
    last_sent_at: string | null;
};

const actions = ['created', 'updated', 'deleted'] as const;

export default function Webhooks({
    webhooks,
    events,
}: {
    webhooks: Webhook[];
    events: string[];
}) {
    const [editing, setEditing] = useState<Webhook | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Webhook | null>(null);
    const [layout, setLayout] = useViewMode('webhooks');
    const existing = editing !== 'new' ? editing : null;
    const types = [...new Set(events.map((e) => e.split('.')[0]))];

    return (
        <>
            <Head title={t('Webhooks')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Webhooks')}
                    description={t(
                        "Tell other systems when records change. Each event is POSTed as JSON, signed with the webhook's secret, and retried twice if the receiver fails.",
                    )}
                >
                    <ViewToggle view={layout} onChange={setLayout} />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add webhook')}
                    </Button>
                </PageHeader>

                <DataTable
                    view={layout}
                    columns={[
                        {
                            key: 'url',
                            header: t('URL'),
                            hideable: false,
                            cell: (w) => (
                                <button
                                    type="button"
                                    onClick={() => setEditing(w)}
                                    className="max-w-md truncate text-left font-mono text-sm text-primary underline-offset-4 hover:underline"
                                >
                                    {w.url}
                                </button>
                            ),
                        },
                        {
                            key: 'events',
                            header: t('Events'),
                            cell: (w) => (
                                <span className="flex flex-wrap gap-1">
                                    {w.events.map((e) => (
                                        <Badge
                                            key={e}
                                            variant="outline"
                                            className="font-mono"
                                        >
                                            {e}
                                        </Badge>
                                    ))}
                                </span>
                            ),
                        },
                        {
                            key: 'last',
                            header: t('Last delivery'),
                            cell: (w) =>
                                w.last_sent_at ? (
                                    <span className="flex flex-col items-start gap-0.5">
                                        {w.last_error ? (
                                            <Badge
                                                variant="destructive"
                                                title={w.last_error}
                                            >
                                                {w.last_status ?? t('Failed')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="success">
                                                {w.last_status}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {formatDue(w.last_sent_at)}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        {t('Not yet')}
                                    </span>
                                ),
                        },
                        {
                            key: 'active',
                            header: t('Status'),
                            cell: (w) =>
                                w.active ? (
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
                    rows={webhooks}
                    rowKey={(w) => w.id}
                    empty={t(
                        'No webhooks yet. Add one to push record changes to another system.',
                    )}
                    actions={(w) => (
                        <>
                            <DropdownMenuItem
                                onSelect={() =>
                                    router.post(
                                        WebhookController.test.url(w.id),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <PaperPlaneTiltIcon />
                                {t('Send test')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setEditing(w)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(w)}
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
                title={existing ? t('Edit webhook') : t('Add webhook')}
                description={t(
                    'Choose the events to send. Receivers should check X-OricCRM-Signature: sha256= HMAC-SHA256 of the raw body with the secret.',
                )}
                form={
                    existing
                        ? WebhookController.update.form(existing.id)
                        : WebhookController.store.form()
                }
                formKey={existing?.id ?? 'new'}
                submitLabel={existing ? t('Save webhook') : t('Add webhook')}
                contentClassName="sm:max-w-xl"
                onClose={() => setEditing(null)}
            >
                {(errors) => (
                    <>
                        <TextField
                            id="webhook-url"
                            label={t('URL')}
                            name="url"
                            type="url"
                            placeholder="https://example.com/hooks/crm"
                            defaultValue={existing?.url}
                            error={errors.url}
                            autoComplete="off"
                        />
                        <FieldSet>
                            <FieldLegend variant="label">
                                {t('Events')}
                            </FieldLegend>
                            <div className="grid grid-cols-[1fr_repeat(3,5rem)] items-center gap-y-2 text-sm">
                                <span />
                                {actions.map((a) => (
                                    <span
                                        key={a}
                                        className="text-center text-xs text-muted-foreground capitalize"
                                    >
                                        {t(
                                            a.charAt(0).toUpperCase() +
                                                a.slice(1),
                                        )}
                                    </span>
                                ))}
                                {types.map((type) => (
                                    <EventRow
                                        key={type}
                                        type={type}
                                        selected={existing?.events ?? []}
                                    />
                                ))}
                            </div>
                            <FieldError>
                                {errors.events ??
                                    Object.entries(errors).find(([k]) =>
                                        k.startsWith('events.'),
                                    )?.[1]}
                            </FieldError>
                        </FieldSet>
                        <SelectField
                            id="webhook-active"
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
                        {existing && (
                            <Field>
                                <FieldLabel htmlFor="webhook-secret">
                                    {t('Signing secret')}
                                </FieldLabel>
                                <Input
                                    id="webhook-secret"
                                    readOnly
                                    value={existing.secret}
                                    className="font-mono text-xs"
                                    onFocus={(e) => e.target.select()}
                                />
                                <FieldDescription>
                                    {t(
                                        'Give this to the receiving system so it can verify deliveries.',
                                    )}
                                </FieldDescription>
                            </Field>
                        )}
                    </>
                )}
            </RecordFormDialog>

            <ConfirmDeleteDialog
                form={deleting && WebhookController.destroy.form(deleting.id)}
                title={t('Delete this webhook?')}
                description={t('Deliveries to it stop straight away.')}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

function EventRow({ type, selected }: { type: string; selected: string[] }) {
    return (
        <>
            <span className="capitalize">
                {t(type.charAt(0).toUpperCase() + type.slice(1) + 's')}
            </span>
            {actions.map((a) => {
                const event = `${type}.${a}`;

                return (
                    <span key={a} className="flex justify-center">
                        <Checkbox
                            name="events[]"
                            value={event}
                            defaultChecked={selected.includes(event)}
                            aria-label={event}
                        />
                    </span>
                );
            })}
        </>
    );
}

Webhooks.layout = { breadcrumbs: [{ title: 'Webhooks', href: index() }] };
