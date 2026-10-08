import { Form, usePage } from '@inertiajs/react';
import { TrashIcon } from '@phosphor-icons/react';
import NoteController from '@/actions/App/Http/Controllers/NoteController';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils';
import type { Note, Regarding } from '@/types';
import { t } from '@/lib/i18n';

/** A record's notes, newest first, with a box to add one. */
export function NotesPanel({
    notes,
    record,
}: {
    notes: Note[];
    record: Regarding;
}) {
    const { auth } = usePage().props;

    return (
        <section className="flex flex-col gap-4">
            <Form
                {...NoteController.store.form()}
                noValidate
                resetOnSuccess
                options={{ preserveScroll: true, preserveState: true }}
                className="flex flex-col gap-3 border bg-card p-4"
            >
                {({ processing, errors }) => (
                    <>
                        <input
                            type="hidden"
                            name="notable_type"
                            value={record.type}
                        />
                        <input
                            type="hidden"
                            name="notable_id"
                            value={record.id}
                        />
                        <Field data-invalid={errors.body ? true : undefined}>
                            <FieldLabel htmlFor="note-body">
                                {t('Add a note')}
                            </FieldLabel>
                            <Textarea
                                id="note-body"
                                name="body"
                                rows={3}
                                placeholder={t(
                                    "What happened, what was agreed, what's next…",
                                )}
                                aria-invalid={errors.body ? true : undefined}
                            />
                            <FieldError>{errors.body}</FieldError>
                        </Field>
                        <Button
                            type="submit"
                            className="self-end"
                            disabled={processing}
                        >
                            {processing && <Spinner data-icon="inline-start" />}
                            {t('Add note')}
                        </Button>
                    </>
                )}
            </Form>

            {notes.length === 0 ? (
                <p className="border border-dashed bg-card px-4 py-8 text-center text-muted-foreground">
                    {t('No notes yet.')}
                </p>
            ) : (
                <ol className="flex flex-col gap-3">
                    {notes.map((note) => (
                        <li
                            key={note.id}
                            className="flex flex-col gap-2 border bg-card p-4"
                        >
                            <div className="flex items-center justify-between gap-2 text-muted-foreground">
                                <span>
                                    <span className="font-medium text-foreground">
                                        {note.author?.name ?? t('Former user')}
                                    </span>
                                    {' · '}
                                    <span className="font-mono tabular-nums">
                                        {formatDateTime(note.created_at)}
                                    </span>
                                </span>
                                {(note.user_id === auth.user.id ||
                                    auth.can.manageUsers) && (
                                    <Form
                                        {...NoteController.destroy.form(
                                            note.id,
                                        )}
                                        options={{
                                            preserveScroll: true,
                                            preserveState: true,
                                        }}
                                    >
                                        <Button
                                            type="submit"
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={t('Delete note')}
                                        >
                                            <TrashIcon />
                                        </Button>
                                    </Form>
                                )}
                            </div>
                            <p className="whitespace-pre-line">{note.body}</p>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
