import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { enGB, ms, zhCN } from 'react-day-picker/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { currentLocale, intlLocale, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const dayPickerLocales = { en: enGB, ms, zh_CN: zhCN } as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** A local date as Y-m-d, the format Laravel validates and stores. */
export function toYmd(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Y-m-d (or the date part of Y-m-dTH:i) as a local date; undefined when empty or invalid. */
export function fromYmd(value?: string | null): Date | undefined {
    const [y, m, d] = (value ?? '').slice(0, 10).split('-').map(Number);

    return y && m && d ? new Date(y, m - 1, d) : undefined;
}

type DatePickerProps = {
    id: string;
    /** Posts the value as Y-m-d in a hidden input with this name. */
    name?: string;
    /** Controlled value (Y-m-d or ""); leave out and use defaultValue for an uncontrolled field. */
    value?: string;
    defaultValue?: string | null;
    onChange?: (value: string) => void;
    placeholder?: string;
    invalid?: boolean;
    className?: string;
};

/**
 * The shadcn date picker: an outline button opening a Calendar in a Popover, with
 * month/year dropdowns and a Clear button.
 */
export function DatePicker({
    id,
    name,
    value,
    defaultValue,
    onChange,
    placeholder,
    invalid,
    className,
}: DatePickerProps) {
    const [inner, setInner] = useState(defaultValue ?? '');
    const [open, setOpen] = useState(false);
    const current = value ?? inner;
    const date = fromYmd(current);

    const set = (next: string) => {
        setInner(next);
        onChange?.(next);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    aria-invalid={invalid}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarBlankIcon data-icon="inline-start" />
                    {date
                        ? date.toLocaleDateString(intlLocale(), {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                          })
                        : (placeholder ?? t('Pick a date'))}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    locale={
                        dayPickerLocales[
                            currentLocale() as keyof typeof dayPickerLocales
                        ] ?? enGB
                    }
                    weekStartsOn={1}
                    selected={date}
                    defaultMonth={date}
                    onSelect={(d) => set(d ? toYmd(d) : '')}
                />
                {date && (
                    <div className="border-t p-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => set('')}
                        >
                            <XIcon data-icon="inline-start" />
                            {t('Clear')}
                        </Button>
                    </div>
                )}
            </PopoverContent>
            {name && <input type="hidden" name={name} value={current} />}
        </Popover>
    );
}

/** Every half hour of the day, for the time half of a date-and-time field. */
const timeOptions = () =>
    Array.from({ length: 48 }, (_, i) => {
        const value = `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`;
        const label = new Date(`2000-01-01T${value}`).toLocaleTimeString(
            intlLocale(),
            { hour: 'numeric', minute: '2-digit' },
        );

        return { value, label };
    });

/**
 * A date picker plus a half-hour time select, posted together as Y-m-dTH:i in one hidden
 * input. Picking a date without a time defaults to 9:00.
 */
export function DateTimePicker({
    id,
    name,
    defaultValue,
    invalid,
}: {
    id: string;
    name: string;
    /** Y-m-dTH:i or empty. */
    defaultValue?: string | null;
    invalid?: boolean;
}) {
    const [day, setDay] = useState((defaultValue ?? '').slice(0, 10));
    const [time, setTime] = useState(
        (defaultValue ?? '').slice(11, 16) || '09:00',
    );
    // A stored time off the half-hour grid stays selectable.
    const times = timeOptions();
    const options = times.some((o) => o.value === time)
        ? times
        : [...times, { value: time, label: time }].sort((a, b) =>
              a.value.localeCompare(b.value),
          );

    return (
        <div className="grid grid-cols-[1fr_9rem] gap-2">
            <DatePicker
                id={id}
                value={day}
                onChange={setDay}
                invalid={invalid}
            />
            <Select value={time} onValueChange={setTime} disabled={!day}>
                <SelectTrigger
                    aria-label={t('Time')}
                    className="w-full"
                    aria-invalid={invalid}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    <SelectGroup>
                        {options.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                                {t.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <input
                type="hidden"
                name={name}
                value={day ? `${day}T${time}` : ''}
            />
        </div>
    );
}
