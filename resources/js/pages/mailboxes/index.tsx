import { Head, router } from '@inertiajs/react';
import {
    ArrowsClockwiseIcon,
    PencilSimpleIcon,
    PlugsConnectedIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import MailboxController from '@/actions/App/Http/Controllers/MailboxController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DataTable } from '@/components/data-table';
import { SelectField, TextField } from '@/components/form-field';
import { ViewToggle } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FieldSeparator } from '@/components/ui/field';
import { useViewMode } from '@/hooks/use-list-filters';
import { formatDue } from '@/lib/utils';
import { index } from '@/routes/mailboxes';
import type { Option } from '@/types';
import { t } from '@/lib/i18n';

type Mailbox = {
    id: number;
    name: string;
    host: string;
    port: number;
    encryption: 'ssl' | 'tls' | 'none';
    username: string;
    folder: string;
    create_cases: boolean;
    draft_quotes: boolean;
    owner_id: number;
    owner: { id: number; name: string };
    allowed_domains: string | null;
    blocked_domains: string | null;
    active: boolean;
    last_synced_at: string | null;
    last_error: string | null;
    emails_count: number;
};

export default function Mailboxes({
    mailboxes,
    owners,
    aiReady,
}: {
    mailboxes: Mailbox[];
    owners: Option[];
    aiReady: boolean;
}) {
    const [editing, setEditing] = useState<Mailbox | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Mailbox | null>(null);
    const [layout, setLayout] = useViewMode('mailboxes');
    const existing = editing !== 'new' ? editing : null;
    const yesNo = [
        { value: '1', label: t('Yes') },
        { value: '0', label: t('No') },
    ];
    const post = (url: string) =>
        router.post(url, {}, { preserveScroll: true });

    return (
        <>
            <Head title={t('Mailboxes')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Mailboxes')}
                    description={t(
                        'Mailboxes the CRM reads every 5 minutes over IMAP: emails can open and continue cases, and quote requests become draft quotes for review.',
                    )}
                >
                    <ViewToggle view={layout} onChange={setLayout} />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add mailbox')}
                    </Button>
                </PageHeader>

                {!aiReady && (
                    <Alert>
                        <AlertTitle>{t('Quote drafting is off')}</AlertTitle>
                        <AlertDescription>
                            {t(
                                "Add ANTHROPIC_API_KEY to the server's .env to let Claude turn quote requests into draft quotes. Until then those emails are marked “skipped” in the Inbox and can be retried later.",
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <DataTable
                    view={layout}
                    columns={[
                        {
                            key: 'name',
                            header: t('Mailbox'),
                            hideable: false,
                            cell: (m) => (
                                <span className="flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(m)}
                                        className="text-left font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                        {m.name}
                                    </button>
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {m.username} · {m.host}
                                    </span>
                                </span>
                            ),
                        },
                        {
                            key: 'does',
                            header: t('Does'),
                            cell: (m) => (
                                <span className="flex flex-wrap gap-1">
                                    {m.create_cases && (
                                        <Badge variant="info">
                                            {t('Cases')}
                                        </Badge>
                                    )}
                                    {m.draft_quotes && (
                                        <Badge variant="info">
                                            {t('Quote drafts')}
                                        </Badge>
                                    )}
                                    {!m.create_cases && !m.draft_quotes && (
                                        <span className="text-muted-foreground">
                                            {t('Log on timelines')}
                                        </span>
                                    )}
                                </span>
                            ),
                        },
                        {
                            key: 'emails',
                            header: t('Emails'),
                            className: 'text-right font-mono tabular-nums',
                            cell: (m) => m.emails_count,
                        },
                        {
                            key: 'synced',
                            header: t('Last read'),
                            cell: (m) =>
                                m.last_error ? (
                                    <Badge
                                        variant="destructive"
                                        title={m.last_error}
                                        className="max-w-56 truncate"
                                    >
                                        {m.last_error}
                                    </Badge>
                                ) : m.last_synced_at ? (
                                    formatDue(m.last_synced_at)
                                ) : (
                                    <span className="text-muted-foreground">
                                        {t('Never')}
                                    </span>
                                ),
                        },
                        {
                            key: 'active',
                            header: t('Status'),
                            cell: (m) =>
                                m.active ? (
                                    <Badge variant="success">{t('On')}</Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        {t('Off')}
                                    </Badge>
                                ),
                        },
                    ]}
                    rows={mailboxes}
                    rowKey={(m) => m.id}
                    empty={t(
                        'No mailboxes yet. Add a support or sales inbox; for Gmail, use an app password (Google account → Security → App passwords).',
                    )}
                    actions={(m) => (
                        <>
                            <DropdownMenuItem
                                onSelect={() =>
                                    post(MailboxController.test.url(m.id))
                                }
                            >
                                <PlugsConnectedIcon />
                                {t('Test connection')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() =>
                                    post(MailboxController.sync.url(m.id))
                                }
                            >
                                <ArrowsClockwiseIcon />
                                {t('Read now')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setEditing(m)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(m)}
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
                        : t('Add mailbox')
                }
                description={t(
                    'IMAP details from your email provider. Gmail: imap.gmail.com, port 993, SSL, your address and an app password.',
                )}
                form={
                    existing
                        ? MailboxController.update.form(existing.id)
                        : MailboxController.store.form()
                }
                formKey={existing?.id ?? 'new'}
                submitLabel={existing ? t('Save mailbox') : t('Add mailbox')}
                twoColumns
                onClose={() => setEditing(null)}
            >
                {(errors) => (
                    <>
                        <TextField
                            id="mb-name"
                            label={t('Name')}
                            name="name"
                            placeholder={t('Support inbox')}
                            defaultValue={existing?.name}
                            error={errors.name}
                            className="sm:col-span-2"
                        />
                        <TextField
                            id="mb-host"
                            label={t('IMAP server')}
                            name="host"
                            placeholder="imap.gmail.com"
                            defaultValue={existing?.host}
                            error={errors.host}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <TextField
                                id="mb-port"
                                label={t('Port')}
                                name="port"
                                inputMode="numeric"
                                defaultValue={String(existing?.port ?? 993)}
                                error={errors.port}
                            />
                            <SelectField
                                id="mb-encryption"
                                label={t('Security')}
                                name="encryption"
                                defaultValue={existing?.encryption ?? 'ssl'}
                                options={[
                                    { value: 'ssl', label: 'SSL' },
                                    { value: 'tls', label: 'STARTTLS' },
                                    { value: 'none', label: t('None') },
                                ]}
                                error={errors.encryption}
                            />
                        </div>
                        <TextField
                            id="mb-username"
                            label={t('Username')}
                            name="username"
                            autoComplete="off"
                            defaultValue={existing?.username}
                            error={errors.username}
                        />
                        <TextField
                            id="mb-password"
                            label={t('Password / app password')}
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            description={
                                existing
                                    ? t('Leave blank to keep the saved one.')
                                    : undefined
                            }
                            error={errors.password}
                        />
                        <TextField
                            id="mb-folder"
                            label={t('Folder')}
                            name="folder"
                            defaultValue={existing?.folder ?? 'INBOX'}
                            error={errors.folder}
                        />
                        <SelectField
                            id="mb-owner"
                            label={t('New cases and leads go to')}
                            name="owner_id"
                            options={owners}
                            defaultValue={
                                existing ? String(existing.owner_id) : null
                            }
                            placeholder={t('Choose a user')}
                            error={errors.owner_id}
                        />

                        <FieldSeparator className="sm:col-span-2">
                            {t('What to do with emails')}
                        </FieldSeparator>
                        <SelectField
                            id="mb-cases"
                            label={t('Open and continue cases')}
                            name="create_cases"
                            options={yesNo}
                            defaultValue={existing?.create_cases ? '1' : '0'}
                        />
                        <SelectField
                            id="mb-quotes"
                            label={t('Draft quotes from requests (Claude)')}
                            name="draft_quotes"
                            options={yesNo}
                            defaultValue={existing?.draft_quotes ? '1' : '0'}
                        />
                        <TextField
                            id="mb-allowed"
                            label={t('Only from these domains')}
                            name="allowed_domains"
                            multiline
                            description={t('One per line. Empty: everyone.')}
                            defaultValue={existing?.allowed_domains ?? ''}
                            error={errors.allowed_domains}
                        />
                        <TextField
                            id="mb-blocked"
                            label={t('Never from these domains')}
                            name="blocked_domains"
                            multiline
                            description={t('One per line, e.g. newsletters.')}
                            defaultValue={existing?.blocked_domains ?? ''}
                            error={errors.blocked_domains}
                        />
                        <SelectField
                            id="mb-active"
                            label={t('Status')}
                            name="active"
                            options={[
                                {
                                    value: '1',
                                    label: t('On: read every 5 minutes'),
                                },
                                { value: '0', label: t('Off') },
                            ]}
                            defaultValue={existing?.active ? '1' : '0'}
                        />
                    </>
                )}
            </RecordFormDialog>

            <ConfirmDeleteDialog
                form={deleting && MailboxController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t(
                    'Its imported emails are removed too. Cases, leads and quotes made from them stay.',
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Mailboxes.layout = { breadcrumbs: [{ title: 'Mailboxes', href: index() }] };
