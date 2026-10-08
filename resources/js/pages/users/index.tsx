import { Form, Head, usePage } from '@inertiajs/react';
import {
    MagnifyingGlassIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import UserController from '@/actions/App/Http/Controllers/UserController';
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
import { index } from '@/routes/users';
import type { Option, Paginated } from '@/types';
import { t } from '@/lib/i18n';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    role_label: string | null;
    team_id: number | null;
    team: string | null;
};

type Team = { id: number; name: string };

type Props = {
    users: Paginated<UserRow>;
    filters: { search: string };
    roles: Option[];
    teams: Team[];
};

const roleVariant: Record<string, 'default' | 'info' | 'success'> = {
    admin: 'default',
    'sales-manager': 'info',
    'sales-rep': 'success',
};

export default function Users({ users, filters, roles, teams }: Props) {
    const { auth } = usePage().props;
    const [editing, setEditing] = useState<UserRow | 'new' | null>(null);
    const [deleting, setDeleting] = useState<UserRow | null>(null);
    const [layout, setLayout] = useViewMode('users');

    const columns: Column<UserRow>[] = [
        {
            key: 'name',
            header: t('Name'),
            cell: (user) => (
                <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-muted-foreground">{user.email}</span>
                </div>
            ),
        },
        {
            key: 'role',
            header: t('Role'),
            cell: (user) =>
                user.role ? (
                    <Badge variant={roleVariant[user.role] ?? 'outline'}>
                        {user.role_label}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">
                        {t('No role')}
                    </span>
                ),
        },
        {
            key: 'team',
            header: t('Team'),
            cell: (user) =>
                user.team ?? (
                    <span className="text-muted-foreground">
                        {t('No team')}
                    </span>
                ),
        },
    ];

    return (
        <>
            <Head title={t('Users')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Users')}
                    description={t(
                        'Everyone who can sign in, with their role and team. The role decides whose records they see.',
                    )}
                >
                    <Button onClick={() => setEditing('new')}>
                        <PlusIcon data-icon="inline-start" />
                        {t('Add user')}
                    </Button>
                </PageHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <Form
                        {...index.form()}
                        options={{ preserveState: true }}
                        className="relative w-full sm:max-w-sm"
                    >
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            name="search"
                            type="search"
                            defaultValue={filters.search}
                            placeholder={t('Search name or email')}
                            aria-label={t('Search users')}
                            className="pl-9"
                        />
                    </Form>
                    <ViewToggle
                        view={layout}
                        onChange={setLayout}
                        className="ml-auto"
                    />
                </div>

                <DataTable
                    view={layout}
                    columns={columns}
                    rows={users.data}
                    rowKey={(user) => user.id}
                    empty={
                        filters.search
                            ? t('No users match “:search”.', {
                                  search: filters.search,
                              })
                            : t('No users yet.')
                    }
                    actions={(user) => (
                        <>
                            <DropdownMenuItem onSelect={() => setEditing(user)}>
                                <PencilSimpleIcon />
                                {t('Edit')}
                            </DropdownMenuItem>
                            {user.id !== auth.user.id && (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => setDeleting(user)}
                                >
                                    <TrashIcon />
                                    {t('Delete')}
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                />

                <ListPagination page={users} />
            </div>

            <UserDialog
                user={editing}
                roles={roles}
                teams={teams}
                onClose={() => setEditing(null)}
            />

            <ConfirmDeleteDialog
                form={deleting && UserController.destroy.form(deleting.id)}
                title={t('Delete :name?', { name: deleting?.name })}
                description={t(
                    "They will no longer be able to sign in. This can't be undone.",
                )}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

function UserDialog({
    user,
    roles,
    teams,
    onClose,
}: {
    user: UserRow | 'new' | null;
    roles: Option[];
    teams: Team[];
    onClose: () => void;
}) {
    const existing = user !== 'new' ? user : null;

    return (
        <RecordFormDialog
            open={user !== null}
            title={existing ? t('Edit user') : t('Add user')}
            description={
                existing
                    ? t('Change their details, role or team.')
                    : t(
                          'They can sign in with this email and password straight away.',
                      )
            }
            form={
                existing
                    ? UserController.update.form(existing.id)
                    : UserController.store.form()
            }
            formKey={existing?.id ?? 'new'}
            submitLabel={existing ? t('Save changes') : t('Add user')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <TextField
                        id="user-name"
                        label={t('Name')}
                        name="name"
                        defaultValue={existing?.name}
                        error={errors.name}
                        autoComplete="off"
                        className="sm:col-span-2"
                    />
                    <TextField
                        id="user-email"
                        label={t('Email')}
                        name="email"
                        type="email"
                        defaultValue={existing?.email}
                        error={errors.email}
                        autoComplete="off"
                        className="sm:col-span-2"
                    />
                    <SelectField
                        id="user-role"
                        label={t('Role')}
                        name="role"
                        options={roles}
                        placeholder={t('Choose a role')}
                        defaultValue={existing?.role}
                        error={errors.role}
                    />
                    <SelectField
                        id="user-team"
                        label={t('Team')}
                        name="team_id"
                        options={teams.map((team) => ({
                            value: String(team.id),
                            label: team.name,
                        }))}
                        noneLabel={t('No team')}
                        defaultValue={
                            existing?.team_id ? String(existing.team_id) : null
                        }
                        error={errors.team_id}
                    />
                    <TextField
                        id="user-password"
                        label={t('Password')}
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        description={
                            existing
                                ? t('Leave blank to keep the current password.')
                                : undefined
                        }
                        error={errors.password}
                        className="sm:col-span-2"
                    />
                </>
            )}
        </RecordFormDialog>
    );
}

Users.layout = {
    breadcrumbs: [{ title: 'Users', href: index() }],
};
