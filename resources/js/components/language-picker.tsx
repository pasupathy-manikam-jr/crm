import { router, usePage } from '@inertiajs/react';
import { TranslateIcon } from '@phosphor-icons/react';
import LocaleController from '@/actions/App/Http/Controllers/LocaleController';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Switches the interface language (saved on the user, and in a cookie for sign-in). */
/** Short labels for the compact (top bar) picker. */
const shortNames: Record<string, string> = {
    en: 'EN',
    ms: 'BM',
    zh_CN: '中文',
};

export function LanguagePicker({
    id,
    className,
    compact = false,
}: {
    id?: string;
    className?: string;
    /** Icon and short code only, for the top bar. */
    compact?: boolean;
}) {
    const { locale, locales } = usePage().props;

    return (
        <Select
            value={locale}
            onValueChange={(next) =>
                router.post(
                    LocaleController.url(),
                    { locale: next },
                    {
                        // Reload so every component (including persistent layouts)
                        // re-renders with the new dictionary.
                        onSuccess: () => window.location.reload(),
                    },
                )
            }
        >
            <SelectTrigger
                id={id}
                aria-label={t('Language')}
                className={cn(compact ? 'w-auto gap-1.5' : 'w-full', className)}
            >
                <TranslateIcon data-icon="inline-start" />
                {compact ? (
                    <span>{shortNames[locale] ?? locale}</span>
                ) : (
                    <SelectValue />
                )}
            </SelectTrigger>
            <SelectContent
                position={compact ? 'popper' : 'item-aligned'}
                align={compact ? 'end' : 'center'}
            >
                <SelectGroup>
                    {Object.entries(locales).map(([value, label]) => (
                        <SelectItem
                            key={value}
                            value={value}
                            lang={value.replace('_', '-')}
                        >
                            {label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
