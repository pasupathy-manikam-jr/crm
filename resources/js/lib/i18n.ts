/**
 * Translations for the signed-in user's language, keyed by the English text (Laravel's
 * lang/<locale>.json, shared once per page load). Layouts call syncLocale() with the page
 * props before the page renders, so t() works anywhere, including outside components.
 */
let dictionary: Record<string, string> = {};
let current = 'en';

const intlTags: Record<string, string> = {
    en: 'en-MY',
    ms: 'ms-MY',
    zh_CN: 'zh-CN',
};

export function syncLocale(
    locale: string,
    translations: Record<string, string> | undefined,
): void {
    current = locale;
    dictionary = translations ?? {};
}

/**
 * The text in the current language, with :placeholders filled in:
 * t('Delete :name?', { name: 'Acme' }).
 */
export function t(
    key: string,
    replace?: Record<string, string | number | null | undefined>,
): string {
    let text = dictionary[key] || key;

    if (replace) {
        // Longest names first, so :name doesn't eat part of :names.
        for (const [name, value] of Object.entries(replace).sort(
            ([a], [b]) => b.length - a.length,
        )) {
            text = text.replaceAll(`:${name}`, String(value ?? ''));
        }
    }

    return text;
}

/** The current app locale: en, ms or zh_CN. */
export function currentLocale(): string {
    return current;
}

/** The BCP 47 tag for Intl formatting (dates, numbers) in the current language. */
export function intlLocale(): string {
    return intlTags[current] ?? 'en-MY';
}
