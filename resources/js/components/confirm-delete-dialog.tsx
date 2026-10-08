import { Form } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/lib/i18n';

type Props = {
    /** The wayfinder `.form()` of the delete action; null keeps the dialog closed. */
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'> | null;
    title: string;
    description: string;
    onClose: () => void;
};

/** Confirms a destructive action before submitting its delete form. */
export function ConfirmDeleteDialog({
    form,
    title,
    description,
    onClose,
}: Props) {
    return (
        <AlertDialog
            open={form !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {form && (
                    <Form
                        {...form}
                        options={{ preserveScroll: true }}
                        onSuccess={onClose}
                    >
                        {({ processing }) => (
                            <AlertDialogFooter>
                                <AlertDialogCancel type="button">
                                    {t('Cancel')}
                                </AlertDialogCancel>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing && (
                                        <Spinner data-icon="inline-start" />
                                    )}
                                    {t('Delete')}
                                </Button>
                            </AlertDialogFooter>
                        )}
                    </Form>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
