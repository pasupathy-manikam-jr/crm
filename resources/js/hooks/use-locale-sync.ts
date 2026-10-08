import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { syncLocale } from '@/lib/i18n';

/**
 * Point t() at the current page's language. Called by the top-level layouts, which render
 * before their page, so every t() call in the page sees the right dictionary.
 */
export function useLocaleSync(): void {
    const { locale, translations } = usePage().props;
    syncLocale(locale, translations);

    useEffect(() => {
        document.documentElement.lang = locale.replace('_', '-');
    }, [locale]);
}
