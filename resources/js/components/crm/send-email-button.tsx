import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import EmailController from '@/actions/App/Http/Controllers/EmailController';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import type { Regarding } from '@/types';
import { t } from '@/lib/i18n';

/** "Send email" for a record; the sent email is logged on it as a done Email activity. */
export function SendEmailButton({
    record,
    to,
}: {
    record: Regarding;
    to?: string | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                <EnvelopeSimpleIcon data-icon="inline-start" />
                {t('Send email')}
            </Button>
            <RecordFormDialog
                open={open}
                title={t('Send email')}
                description={t(
                    'Sent from the CRM with your name; replies come to your own inbox. A copy is saved under Activities.',
                )}
                form={EmailController.store.form()}
                formKey={`${record.type}-${record.id}`}
                submitLabel={t('Send')}
                twoColumns
                onClose={() => setOpen(false)}
            >
                {(errors) => (
                    <>
                        <input
                            type="hidden"
                            name="regarding_type"
                            value={record.type}
                        />
                        <input
                            type="hidden"
                            name="regarding_id"
                            value={record.id}
                        />
                        <TextField
                            id="email-to"
                            label={t('To')}
                            name="to"
                            type="email"
                            defaultValue={to ?? ''}
                            error={errors.to}
                            autoComplete="off"
                        />
                        <TextField
                            id="email-cc"
                            label={t('Cc (optional)')}
                            name="cc"
                            type="email"
                            error={errors.cc}
                            autoComplete="off"
                        />
                        <TextField
                            id="email-subject"
                            label={t('Subject')}
                            name="subject"
                            error={errors.subject}
                            className="sm:col-span-2"
                            autoComplete="off"
                        />
                        <TextField
                            id="email-body"
                            label={t('Message')}
                            name="body"
                            multiline
                            error={errors.body}
                            className="sm:col-span-2"
                        />
                    </>
                )}
            </RecordFormDialog>
        </>
    );
}
