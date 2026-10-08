import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';
import CsvController from '@/actions/App/Http/Controllers/CsvController';
import { SelectField } from '@/components/form-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/lib/i18n';

export type CsvField = { value: string; label: string; required: boolean };

/** Column names of a CSV's first line (handles quoted cells and a UTF-8 BOM). */
function headerOf(text: string): string[] {
    const line = text.replace(/^﻿/, '').split(/\r?\n/)[0] ?? '';
    const cells: string[] = [];
    let cell = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (quoted) {
            if (ch === '"' && line[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (ch === '"') {
                quoted = false;
            } else {
                cell += ch;
            }
        } else if (ch === '"') {
            quoted = true;
        } else if (ch === ',') {
            cells.push(cell.trim());
            cell = '';
        } else {
            cell += ch;
        }
    }

    return [...cells, cell.trim()];
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Best-guess column for a field: same name, or one name containing the other. */
function guess(field: CsvField, headers: string[]): string | null {
    const keys = [squash(field.value), squash(field.label)];
    const exact = headers.findIndex((h) => keys.includes(squash(h)));
    const loose = headers.findIndex((h) =>
        keys.some(
            (k) =>
                squash(h).includes(k) ||
                (squash(h) !== '' && k.includes(squash(h))),
        ),
    );
    const index = exact >= 0 ? exact : loose;

    return index >= 0 ? String(index) : null;
}

/**
 * Upload a CSV, match its columns to fields (pre-guessed from the header row), import.
 * Rows that fail validation are skipped and listed.
 */
export function ImportDialog({
    type,
    noun,
    fields,
    open,
    onClose,
}: {
    type: 'accounts' | 'contacts' | 'leads';
    noun: string;
    fields: CsvField[];
    open: boolean;
    onClose: () => void;
}) {
    const { flash } = usePage();
    const skipped = (flash as { importSkipped?: string[] }).importSkipped ?? [];
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileKey, setFileKey] = useState(0);

    const readHeader = async (file: File | undefined) => {
        setHeaders(file ? headerOf(await file.slice(0, 64 * 1024).text()) : []);
        setFileKey((k) => k + 1);
    };

    const columns = headers.map((h, i) => ({
        value: String(i),
        label: h || t('Column :number', { number: i + 1 }),
    }));

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {t('Import :noun from CSV', { noun })}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'The first row must hold column names. Up to 5,000 rows; you become the owner of every imported record.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...CsvController.import.form(type)}
                    noValidate
                    options={{ preserveScroll: true, preserveState: true }}
                    resetOnSuccess
                    onSuccess={() => setHeaders([])}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {skipped.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertTitle>
                                        {t('Some rows were skipped')}
                                    </AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc pl-4">
                                            {skipped.map((s) => (
                                                <li key={s}>{s}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <FieldGroup className="gap-5">
                                <Field
                                    data-invalid={
                                        errors.file ? true : undefined
                                    }
                                >
                                    <FieldLabel htmlFor="import-file">
                                        {t('CSV file')}
                                    </FieldLabel>
                                    <Input
                                        id="import-file"
                                        type="file"
                                        name="file"
                                        accept=".csv,text/csv"
                                        onChange={(e) =>
                                            void readHeader(e.target.files?.[0])
                                        }
                                        aria-invalid={
                                            errors.file ? true : undefined
                                        }
                                    />
                                    <FieldDescription>
                                        {t(
                                            'Save from Excel or Google Sheets as “CSV (comma separated)”.',
                                        )}
                                    </FieldDescription>
                                    <FieldError>{errors.file}</FieldError>
                                </Field>

                                {headers.length > 0 && (
                                    <div
                                        key={fileKey}
                                        className="grid items-start gap-4 sm:grid-cols-2"
                                    >
                                        {fields.map((f) => (
                                            <SelectField
                                                key={f.value}
                                                id={`map-${f.value}`}
                                                label={
                                                    f.required
                                                        ? `${f.label} *`
                                                        : f.label
                                                }
                                                name={`map[${f.value}]`}
                                                options={columns}
                                                noneLabel={t('Don’t import')}
                                                defaultValue={guess(f, headers)}
                                            />
                                        ))}
                                    </div>
                                )}
                                {errors.map && (
                                    <FieldError>{errors.map}</FieldError>
                                )}
                            </FieldGroup>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        {t('Close')}
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || headers.length === 0
                                    }
                                >
                                    {processing && (
                                        <Spinner data-icon="inline-start" />
                                    )}
                                    {t('Import')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
