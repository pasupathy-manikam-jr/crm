import { Head } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import TeamController from '@/actions/App/Http/Controllers/TeamController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { DataTable } from '@/components/data-table';
import { ViewToggle } from '@/components/list-toolbar';
import { TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useViewMode } from '@/hooks/use-list-filters';
import { index } from '@/routes/teams';
import { t } from '@/lib/i18n';

type TeamRow = { id: number; name: string; users_count: number };

export default function Teams({ teams }: { teams: TeamRow[] }) {
    const [editing, setEditing] = useState<TeamRow | 'new' | null>(null);
    const [deleting, setDeleting] = useState<TeamRow | null>(null);
    const [layout, setLayout] = useViewMode('teams');
    const existing = editing !== 'new' ? editing : null;

    return (
        <>
            <Head title={t('Teams')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Teams')}
                    description={t(
                        'Sales managers see the records of everyone in their team.',
                    )}
                >
                    <ViewToggle view={layout} onChange={setLayout} />
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add team')}
                    </Button>
                </PageHeader>

                <DataTable
                    view={layout}
                    columns={[
                        {
                            key: 'name',
                            header: t('Team'),
                            cell: (team) => (
                                <span className="font-medium">{team.name}</span>
                            ),
                        },
                        {
                            key: 'members',
                            header: t('Members'),
                            className: 'text-right font-mono tabular-nums',
                            cell: (team) => team.users_count,
                        },
                    ]}
                    rows={teams}
                    rowKey={(team) => team.id}
                    empty={t(
                        'No teams yet. Add one, then put users in it from the Users page.',
                    )}
                    actions={(team) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEditing(team)}>
                                <PencilSimpleIcon />
                                {t('Rename')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(team)}
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
                title={existing ? t('Rename team') : t('Add team')}
                description={t(
                    'Team names are shown on the Users page and in record filters.',
                )}
                form={
                    existing
                        ? TeamController.update.form(existing.id)
                        : TeamController.store.form()
                }
                formKey={existing?.id ?? 'new'}
                submitLabel={existing ? t('Save') : t('Add team')}
                onClose={() => setEditing(null)}
            >
                {(errors) => (
                    <TextField
                        id="team-name"
                        label={t('Name')}
                        name="name"
                        defaultValue={existing?.name}
                        error={errors.name}
                        autoComplete="off"
                    />
                )}
            </RecordFormDialog>

            <ConfirmDeleteDialog
                form={deleting && TeamController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t(
                    'Its :count member(s) stay, but without a team. Their manager will no longer see their records.',
                    { count: deleting?.users_count ?? 0 },
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

Teams.layout = {
    breadcrumbs: [{ title: 'Teams', href: index() }],
};
