import { Form, usePage } from '@inertiajs/react';
import {
    DownloadSimpleIcon,
    FileIcon,
    FileImageIcon,
    FilePdfIcon,
    TrashIcon,
    UploadSimpleIcon,
} from '@phosphor-icons/react';
import AttachmentController from '@/actions/App/Http/Controllers/AttachmentController';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatBytes, formatDateTime } from '@/lib/utils';
import type { Attachment, Regarding } from '@/types';
import { t } from '@/lib/i18n';

function iconFor(mime: string | null) {
    if (mime?.startsWith('image/')) {
        return FileImageIcon;
    }

    return mime === 'application/pdf' ? FilePdfIcon : FileIcon;
}

/** A record's files: upload, download, delete. Files are private to people who can see the record. */
export function FilesPanel({
    attachments,
    record,
}: {
    attachments: Attachment[];
    record: Regarding;
}) {
    const { auth } = usePage().props;

    return (
        <section className="flex flex-col gap-4">
            <Form
                {...AttachmentController.store.form()}
                noValidate
                resetOnSuccess
                options={{ preserveScroll: true, preserveState: true }}
                className="flex flex-wrap items-end gap-3 border bg-card p-4"
            >
                {({ processing, errors, progress }) => (
                    <>
                        <input
                            type="hidden"
                            name="attachable_type"
                            value={record.type}
                        />
                        <input
                            type="hidden"
                            name="attachable_id"
                            value={record.id}
                        />
                        <Field
                            data-invalid={errors.file ? true : undefined}
                            className="min-w-0 flex-1"
                        >
                            <FieldLabel htmlFor="attachment-file">
                                {t('Upload a file')}
                            </FieldLabel>
                            <Input
                                id="attachment-file"
                                type="file"
                                name="file"
                                aria-invalid={errors.file ? true : undefined}
                            />
                            <FieldDescription>
                                {t(
                                    'PDF, Office documents, images, text or zip, up to 10 MB.',
                                )}
                            </FieldDescription>
                            <FieldError>{errors.file}</FieldError>
                        </Field>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="mb-7"
                        >
                            {processing ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <UploadSimpleIcon data-icon="inline-start" />
                            )}
                            {processing && progress
                                ? t('Uploading :percent%', {
                                      percent: progress.percentage,
                                  })
                                : t('Upload')}
                        </Button>
                    </>
                )}
            </Form>

            <DataTable
                columns={[
                    {
                        key: 'name',
                        header: t('File'),
                        cell: (f) => {
                            const Icon = iconFor(f.mime_type);

                            return (
                                <a
                                    href={AttachmentController.show.url(f.id)}
                                    className="flex items-center gap-2 font-medium hover:underline"
                                >
                                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{f.name}</span>
                                </a>
                            );
                        },
                    },
                    {
                        key: 'size',
                        header: t('Size'),
                        className: 'font-mono tabular-nums',
                        cell: (f) => formatBytes(f.size),
                    },
                    {
                        key: 'by',
                        header: t('Uploaded by'),
                        cell: (f) => f.uploader?.name ?? t('Former user'),
                    },
                    {
                        key: 'at',
                        header: t('When'),
                        className: 'font-mono tabular-nums',
                        cell: (f) => formatDateTime(f.created_at),
                    },
                    {
                        key: 'actions',
                        header: <span className="sr-only">{t('Actions')}</span>,
                        className: 'w-px',
                        cell: (f) => (
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon-sm" asChild>
                                    <a
                                        href={AttachmentController.show.url(
                                            f.id,
                                        )}
                                        aria-label={t('Download :name', {
                                            name: f.name,
                                        })}
                                    >
                                        <DownloadSimpleIcon />
                                    </a>
                                </Button>
                                {(f.user_id === auth.user.id ||
                                    auth.can.manageUsers) && (
                                    <Form
                                        {...AttachmentController.destroy.form(
                                            f.id,
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
                                            aria-label={t('Delete :name', {
                                                name: f.name,
                                            })}
                                        >
                                            <TrashIcon />
                                        </Button>
                                    </Form>
                                )}
                            </div>
                        ),
                    },
                ]}
                rows={attachments}
                rowKey={(f) => f.id}
                empty={t('No files yet.')}
            />
        </section>
    );
}
