import { Form } from '@inertiajs/react';
import type { ComponentProps, ReactNode } from 'react';
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
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

type Props = {
    open: boolean;
    title: string;
    description: string;
    /** The wayfinder `.form()` of the store or update action. */
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    /** Changes when a different record is edited, so the fields reset. */
    formKey: string | number;
    submitLabel: string;
    /** Lay the fields out in two columns from the small breakpoint up. */
    twoColumns?: boolean;
    /** Extra classes for the dialog box, e.g. a wider max width. */
    contentClassName?: string;
    onClose: () => void;
    /** The Field elements, given Laravel's validation errors. */
    children: (errors: Record<string, string>) => ReactNode;
};

/**
 * The shadcn dialog-with-form pattern every add/edit uses: header, a FieldGroup of
 * Fields, and a footer with Cancel (DialogClose) and submit. Validation is Laravel's only.
 */
export function RecordFormDialog({
    open,
    title,
    description,
    form,
    formKey,
    submitLabel,
    twoColumns = false,
    contentClassName,
    onClose,
    children,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent
                className={cn(
                    'max-h-[90svh] overflow-y-auto',
                    twoColumns && 'sm:max-w-xl',
                    contentClassName,
                )}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {open && (
                    <Form
                        key={formKey}
                        noValidate
                        {...form}
                        // preserveState keeps the open tab on a record page after saving.
                        options={{ preserveScroll: true, preserveState: true }}
                        onSuccess={onClose}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FieldGroup
                                    className={cn(
                                        'gap-5',
                                        twoColumns &&
                                            'sm:grid sm:grid-cols-2 sm:items-start',
                                    )}
                                >
                                    {children(errors)}
                                </FieldGroup>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            {t('Cancel')}
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>
                                        {processing && (
                                            <Spinner data-icon="inline-start" />
                                        )}
                                        {submitLabel}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
