import { Form, Head, usePage } from '@inertiajs/react';
import { CopyIcon, KeyIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import ApiTokenController from '@/actions/App/Http/Controllers/Settings/ApiTokenController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import { SelectField, TextField } from '@/components/form-field';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import { index } from '@/routes/api-tokens';
import { t } from '@/lib/i18n';

type Token = {
    id: number;
    name: string;
    abilities: string[];
    last_used_at: string | null;
    created_at: string;
};

type Props = { tokens: Token[]; apiBase: string; types: string[] };

/** A translated sentence whose :placeholders are shown as inline code. */
function withCode(text: string) {
    return text
        .split(/:(\w+)/)
        .map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

export default function ApiTokens({ tokens, apiBase, types }: Props) {
    const { flash } = usePage();
    const newToken = (flash as { newToken?: string }).newToken;
    const [revoking, setRevoking] = useState<Token | null>(null);
    const [copied, setCopied] = useState(false);

    return (
        <>
            <Head title={t('API tokens')} />
            <h1 className="sr-only">{t('API tokens')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('API tokens')}
                    description={t(
                        'Let other systems read or change CRM records as you. A token sees exactly what you can see.',
                    )}
                />

                <Form
                    {...ApiTokenController.store.form()}
                    noValidate
                    resetOnSuccess
                    options={{ preserveScroll: true }}
                    className="flex flex-col gap-4"
                >
                    {({ processing, errors }) => (
                        <FieldGroup className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
                            <TextField
                                id="token-name"
                                label={t('Token name')}
                                name="name"
                                placeholder={t('e.g. Accounting sync')}
                                autoComplete="off"
                                error={errors.name}
                            />
                            <SelectField
                                id="token-access"
                                label={t('Access')}
                                name="access"
                                defaultValue="read"
                                options={[
                                    { value: 'read', label: t('Read only') },
                                    {
                                        value: 'write',
                                        label: t('Read & write'),
                                    },
                                ]}
                                error={errors.access}
                            />
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <KeyIcon data-icon="inline-start" />
                                )}
                                {t('Create token')}
                            </Button>
                        </FieldGroup>
                    )}
                </Form>

                {newToken && (
                    <Alert className="border-success/40 bg-success/10">
                        <KeyIcon />
                        <AlertTitle>{t('Copy your new token now')}</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2">
                            {t('It won’t be shown again.')}
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={newToken}
                                    aria-label={t('New API token')}
                                    className="font-mono text-xs"
                                    onFocus={(e) => e.target.select()}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        void navigator.clipboard.writeText(
                                            newToken,
                                        );
                                        setCopied(true);
                                    }}
                                >
                                    <CopyIcon data-icon="inline-start" />
                                    {copied ? t('Copied') : t('Copy')}
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <DataTable
                    columns={[
                        {
                            key: 'name',
                            header: t('Token'),
                            cell: (token) => (
                                <span className="font-medium">
                                    {token.name}
                                </span>
                            ),
                        },
                        {
                            key: 'access',
                            header: t('Access'),
                            cell: (token) =>
                                token.abilities.includes('write') ? (
                                    <Badge variant="warning">
                                        {t('Read & write')}
                                    </Badge>
                                ) : (
                                    <Badge variant="info">
                                        {t('Read only')}
                                    </Badge>
                                ),
                        },
                        {
                            key: 'used',
                            header: t('Last used'),
                            className: 'font-mono tabular-nums',
                            cell: (token) =>
                                token.last_used_at
                                    ? formatDate(token.last_used_at)
                                    : t('Never'),
                        },
                    ]}
                    rows={tokens}
                    rowKey={(token) => token.id}
                    empty={t('No tokens yet.')}
                    actions={(token) => (
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setRevoking(token)}
                        >
                            <TrashIcon />
                            {t('Revoke')}
                        </DropdownMenuItem>
                    )}
                />

                <section className="flex flex-col gap-3 border bg-card p-4 text-sm">
                    <h2 className="font-semibold">{t('Using the API')}</h2>
                    <p className="text-muted-foreground">
                        {t('Send the token as a Bearer header.')}{' '}
                        {withCode(
                            t(
                                'Lists are paginated (25 by default, :per_page up to 100) and accept :search, :owner_id, :updated_since and :status.',
                            ),
                        )}{' '}
                        {t(
                            'PATCH changes only the fields you send. Limit: 120 requests a minute.',
                        )}
                    </p>
                    <pre className="overflow-x-auto bg-muted p-3 font-mono text-xs">
                        {`curl -H "Authorization: Bearer <token>" \\
     -H "Accept: application/json" \\
     ${apiBase}/leads?search=acme`}
                    </pre>
                    <ul className="grid gap-1 font-mono text-xs sm:grid-cols-2">
                        {types.map((type) => (
                            <li key={type}>
                                GET POST /{type} · GET PATCH DELETE /{type}
                                /&#123;id&#125;
                            </li>
                        ))}
                        <li>GET /me</li>
                    </ul>
                </section>
            </div>

            <ConfirmDeleteDialog
                form={revoking && ApiTokenController.destroy.form(revoking.id)}
                title={t('Revoke “:name”?', { name: revoking?.name })}
                description={t(
                    'Anything using this token stops working straight away.',
                )}
                onClose={() => setRevoking(null)}
            />
        </>
    );
}

ApiTokens.layout = {
    breadcrumbs: [{ title: 'API tokens', href: index() }],
};
