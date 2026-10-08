<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * The languages the CRM speaks. Each user picks one (users.locale); guests get the
 * locale cookie or their browser's preference. Strings are keyed by their English text
 * in lang/<locale>.json; English needs no file.
 */
final class Locales
{
    /**
     * Each locale's own name for itself, as the language picker shows it.
     *
     * @var array<string, string>
     */
    public const SUPPORTED = [
        'en' => 'English',
        'ms' => 'Bahasa Melayu',
        'zh_CN' => '简体中文',
    ];

    public static function for(Request $request): string
    {
        $locale = $request->user()?->getAttribute('locale')
            ?? $request->cookie('locale')
            ?? $request->getPreferredLanguage(array_keys(self::SUPPORTED));

        return is_string($locale) && isset(self::SUPPORTED[$locale]) ? $locale : 'en';
    }

    /**
     * The JSON translations for a locale (empty for English: keys are the English text).
     *
     * @return array<string, string>
     */
    public static function translations(string $locale): array
    {
        $path = lang_path("{$locale}.json");

        return is_file($path) ? (array) json_decode((string) file_get_contents($path), true) : [];
    }

    /**
     * Changes whenever the locale or its file changes, so browsers refetch the dictionary.
     */
    public static function version(string $locale): string
    {
        $path = lang_path("{$locale}.json");

        return $locale.'-'.(is_file($path) ? filemtime($path) : 0);
    }
}
