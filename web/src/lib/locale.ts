const LOCALE_MAP: Record<string, string> = {
    en: 'en-US',
    ru: 'ru-RU',
    uz: 'uz-UZ',
    cn: 'zh-CN',
};

/**
 * Get the Intl locale string for a given language code.
 */
export function getLocale(language: string): string {
    return LOCALE_MAP[language] || 'en-US';
}
