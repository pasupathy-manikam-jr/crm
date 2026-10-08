import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { intlLocale, t } from '@/lib/i18n';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/** A date the way people read it, e.g. "7 Oct 2026". */
export function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(intlLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** An amount in the CRM's currency, e.g. "RM 12,400.00". */
export function formatMoney(amount: string | number, currency: string): string {
    return new Intl.NumberFormat(intlLocale(), {
        style: 'currency',
        currency,
    }).format(Number(amount));
}

/** A due date the way a to-do list reads it: "Today 9:30 am", "Tomorrow 2:00 pm", "8 Oct 2026". */
export function formatDue(value: string): string {
    const date = new Date(value);
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
    const time = date.toLocaleTimeString(intlLocale(), {
        hour: 'numeric',
        minute: '2-digit',
    });

    if (diff === 0) {
        return t('Today :time', { time });
    }

    if (diff === 1) {
        return t('Tomorrow :time', { time });
    }

    if (diff === -1) {
        return t('Yesterday :time', { time });
    }

    return `${formatDate(value)} ${time}`;
}

/** A date as a <input type="datetime-local"> value in the viewer's time zone. */
export function toDateTimeInput(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Open and due before now. */
export function isOverdue(
    dueAt: string | null,
    doneAt: string | null,
): boolean {
    return (
        !doneAt &&
        !!dueAt &&
        new Date(dueAt) < new Date(new Date().setHours(0, 0, 0, 0))
    );
}

/** A file size people read: "840 KB", "2.4 MB". */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }

    return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** Date and time, e.g. "7 Oct 2026, 2:30 pm". */
export function formatDateTime(value: string): string {
    return new Date(value).toLocaleString(intlLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
