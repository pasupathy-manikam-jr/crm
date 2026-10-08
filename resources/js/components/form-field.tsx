import type { ComponentProps } from 'react';
import { DatePicker, DateTimePicker } from '@/components/date-picker';
import PasswordInput from '@/components/password-input';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Option } from '@/types';

type FieldProps = {
    id: string;
    label: string;
    name: string;
    /** The Laravel validation message for this field, if any. */
    error?: string;
    description?: string;
    className?: string;
};

/** A shadcn Field: label, input (textarea or password when asked) and its server error. */
export function TextField({
    id,
    label,
    name,
    error,
    description,
    className,
    multiline = false,
    ...input
}: FieldProps & { multiline?: boolean } & Omit<
        ComponentProps<'input'>,
        'name' | 'id'
    >) {
    const invalid = error ? true : undefined;

    return (
        <Field data-invalid={invalid} className={className}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {multiline ? (
                <Textarea
                    id={id}
                    name={name}
                    rows={3}
                    defaultValue={input.defaultValue as string | undefined}
                    aria-invalid={invalid}
                />
            ) : input.type === 'password' ? (
                <PasswordInput
                    id={id}
                    name={name}
                    aria-invalid={invalid}
                    {...input}
                />
            ) : (
                <Input id={id} name={name} aria-invalid={invalid} {...input} />
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError>{error}</FieldError>
        </Field>
    );
}

/**
 * A shadcn Field holding a Select posted with its form. With `noneLabel`, an extra
 * "none" option posts the value "none", which the form request turns into null.
 */
export function SelectField({
    id,
    label,
    name,
    error,
    description,
    className,
    options,
    defaultValue,
    placeholder,
    noneLabel,
    onValueChange,
}: FieldProps & {
    options: Option[];
    defaultValue?: string | null;
    placeholder?: string;
    noneLabel?: string;
    onValueChange?: (value: string) => void;
}) {
    const invalid = error ? true : undefined;

    return (
        <Field data-invalid={invalid} className={className}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Select
                name={name}
                defaultValue={defaultValue ?? (noneLabel ? 'none' : undefined)}
                onValueChange={onValueChange}
            >
                <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={invalid}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {noneLabel && (
                            <SelectItem value="none">{noneLabel}</SelectItem>
                        )}
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError>{error}</FieldError>
        </Field>
    );
}

/** A shadcn Field holding a date picker; posts Y-m-d (or Y-m-dTH:i with `withTime`). */
export function DateField({
    id,
    label,
    name,
    error,
    description,
    className,
    defaultValue,
    withTime = false,
}: FieldProps & { defaultValue?: string | null; withTime?: boolean }) {
    const invalid = error ? true : undefined;

    return (
        <Field data-invalid={invalid} className={className}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {withTime ? (
                <DateTimePicker
                    id={id}
                    name={name}
                    defaultValue={defaultValue}
                    invalid={invalid}
                />
            ) : (
                <DatePicker
                    id={id}
                    name={name}
                    defaultValue={defaultValue}
                    invalid={invalid}
                />
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError>{error}</FieldError>
        </Field>
    );
}

/** A compact select for list filters; "" means no filter. */
export function FilterSelect({
    label,
    value,
    allLabel,
    options,
    onChange,
}: {
    label: string;
    value: string;
    allLabel: string;
    options: Option[];
    onChange: (value: string) => void;
}) {
    return (
        <Select
            value={value || 'all'}
            onValueChange={(v) => onChange(v === 'all' ? '' : v)}
        >
            <SelectTrigger aria-label={label} className="w-auto min-w-36">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="all">{allLabel}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
