import { DownloadSimpleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import CsvController from '@/actions/App/Http/Controllers/CsvController';
import type { CsvField } from '@/components/crm/import-dialog';
import { ImportDialog } from '@/components/crm/import-dialog';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

/** Import and Export buttons for a list page; export carries the page's current filters. */
export function CsvActions({
    type,
    noun,
    fields,
    filters,
}: {
    type: 'accounts' | 'contacts' | 'leads';
    noun: string;
    fields: CsvField[];
    filters: Record<string, string>;
}) {
    const [importing, setImporting] = useState(false);
    const query = Object.fromEntries(
        Object.entries(filters).filter(
            ([k, v]) => v !== '' && ['search', 'owner', 'status'].includes(k),
        ),
    );

    return (
        <>
            <Button variant="outline" onClick={() => setImporting(true)}>
                <UploadSimpleIcon data-icon="inline-start" />
                {t('Import')}
            </Button>
            <Button variant="outline" asChild>
                <a href={CsvController.export.url(type, { query })}>
                    <DownloadSimpleIcon data-icon="inline-start" />
                    {t('Export')}
                </a>
            </Button>
            <ImportDialog
                type={type}
                noun={noun}
                fields={fields}
                open={importing}
                onClose={() => setImporting(false)}
            />
        </>
    );
}
