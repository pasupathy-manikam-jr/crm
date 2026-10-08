import { Head } from '@inertiajs/react';
import {
    CodeIcon,
    CopyIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import WebFormController from '@/actions/App/Http/Controllers/WebFormController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import type { Column } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { SelectField, TextField } from '@/components/form-field';
import { ViewToggle } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useClipboard } from '@/hooks/use-clipboard';
import { useViewMode } from '@/hooks/use-list-filters';
import { index } from '@/routes/web-forms';
import type { Option, Owner } from '@/types';
import { t } from '@/lib/i18n';

type WebForm = {
    id: number;
    name: string;
    owner_id: number;
    owner: Owner;
    redirect_url: string | null;
    active: boolean;
    submissions: number;
    submit_url: string;
};

/** Plain HTML the website can paste in; style it with the site's own CSS. */
function embedCode(form: WebForm): string {
    return `<form action="${form.submit_url}" method="POST">
  <label>First name <input name="first_name" required></label>
  <label>Last name <input name="last_name" required></label>
  <label>Email <input type="email" name="email"></label>
  <label>Phone <input type="tel" name="phone"></label>
  <label>Company <input name="company"></label>
  <label>Message <textarea name="message"></textarea></label>
  <!-- Leave this hidden field in: it catches spam bots. -->
  <input type="text" name="website_url" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
  <button type="submit">Send</button>
</form>`;
}

export default function WebForms({
    forms,
    owners,
}: {
    forms: WebForm[];
    owners: Option[];
}) {
    const [layout, setLayout] = useViewMode('web-forms');
    const [editing, setEditing] = useState<WebForm | 'new' | null>(null);
    const [deleting, setDeleting] = useState<WebForm | null>(null);
    const [embedding, setEmbedding] = useState<WebForm | null>(null);
    const [copied, copy] = useClipboard();
    const existing = editing !== 'new' ? editing : null;

    const columns: Column<WebForm>[] = [
        {
            key: 'name',
            header: t('Form'),
            hideable: false,
            cell: (f) => <span className="font-medium">{f.name}</span>,
        },
        {
            key: 'owner',
            header: t('New leads go to'),
            cell: (f) => f.owner.name,
        },
        {
            key: 'submissions',
            header: t('Submissions'),
            className: 'text-right font-mono tabular-nums',
            cell: (f) => f.submissions,
        },
        {
            key: 'redirect',
            header: t('After submitting'),
            cell: (f) =>
                f.redirect_url ?? (
                    <span className="text-muted-foreground">
                        {t('Thank-you page')}
                    </span>
                ),
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
    ];

    return (
        <>
            <Head title={t('Website forms')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Website forms')}
                    description={t(
                        "Put a form on your website; every submission becomes a lead, source Website, with the visitor's message as a note.",
                    )}
                >
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('New form')}
                    </Button>
                </PageHeader>
                <div className="flex justify-end">
                    <ViewToggle view={layout} onChange={setLayout} />
                </div>
                <DataTable
                    view={layout}
                    columns={columns}
                    rows={forms}
                    rowKey={(f) => f.id}
                    empty={t(
                        'No website forms yet. Create one, then paste its embed code onto your site.',
                    )}
                    actions={(f) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEmbedding(f)}>
                                <CodeIcon />
                                {t('Embed code')}
                            </DropdownMenuItem>
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
                        ? t('Edit :name', { name: existing.name })
                        : t('New website form')
                }
                description={t(
                    'Leads from this form are owned by the person you choose. Inactive forms stop accepting submissions.',
                )}
                form={
                    existing
                        ? WebFormController.update.form(existing.id)
                        : WebFormController.store.form()
                }
                formKey={existing?.id ?? 'new'}
                submitLabel={existing ? t('Save changes') : t('Create form')}
                twoColumns
                onClose={() => setEditing(null)}
            >
                {(errors) => (
                    <>
                        <TextField
                            id="wf-name"
                            label={t('Name')}
                            name="name"
                            placeholder={t('e.g. Contact us page')}
                            defaultValue={existing?.name}
                            error={errors.name}
                            className="sm:col-span-2"
                            autoComplete="off"
                        />
                        <SelectField
                            id="wf-owner"
                            label={t('New leads go to')}
                            name="owner_id"
                            options={owners}
                            placeholder={t('Choose a person')}
                            defaultValue={
                                existing ? String(existing.owner_id) : null
                            }
                            error={errors.owner_id}
                        />
                        <SelectField
                            id="wf-active"
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
                            id="wf-redirect"
                            label={t('Thank-you page (optional)')}
                            name="redirect_url"
                            type="url"
                            placeholder="https://yoursite.com/thanks"
                            description={t(
                                'Where visitors go after submitting. Leave empty for a plain thank-you message.',
                            )}
                            defaultValue={existing?.redirect_url ?? ''}
                            error={errors.redirect_url}
                            className="sm:col-span-2"
                        />
                    </>
                )}
            </RecordFormDialog>

            <Dialog
                open={embedding !== null}
                onOpenChange={(open) => !open && setEmbedding(null)}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('Embed “:name”', { name: embedding?.name })}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                "Paste this into your website's HTML. Keep the field names; you can restyle, reorder or remove the optional fields.",
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <pre className="max-h-80 overflow-auto border bg-muted p-3 font-mono text-xs whitespace-pre">
                        {embedding && embedCode(embedding)}
                    </pre>
                    <DialogFooter>
                        <Button
                            onClick={() =>
                                embedding && void copy(embedCode(embedding))
                            }
                        >
                            <CopyIcon data-icon="inline-start" />
                            {copied ? t('Copied') : t('Copy code')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                form={deleting && WebFormController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t(
                    'The form on your website will stop working. Leads it already created are kept.',
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

WebForms.layout = { breadcrumbs: [{ title: 'Website forms', href: index() }] };
