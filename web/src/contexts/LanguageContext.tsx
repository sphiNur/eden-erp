import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTelegramUser } from '../lib/telegram';
import { I18nString } from '../types';
import translations, { TranslationKey } from '../i18n/translations';

export type LanguageCode = 'en' | 'ru' | 'uz' | 'cn';

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    /** Translate a dynamic i18n object (from backend JSONB) */
    t: (data: I18nString) => string;
    /** Translate a static UI string key from the translations dictionary */
    ui: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'ru', label: 'Русский', flag: 'RU' },
    { code: 'uz', label: 'Oʻzbek', flag: 'UZ' },
    { code: 'cn', label: '中文', flag: 'CN' },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<LanguageCode>('en');

    useEffect(() => {
        // Initialize from Telegram if available
        try {
            const tgUser = getTelegramUser();
            const tgLang = tgUser?.language_code;
            if (tgLang) {
                setTimeout(() => {
                    if (tgLang === 'zh' || tgLang.startsWith('zh-')) setLanguage('cn');
                    else if (tgLang === 'uz') setLanguage('uz');
                    else if (tgLang === 'ru') setLanguage('ru');
                    else setLanguage('en');
                }, 0);
            }
        } catch {
            // Outside Telegram — use default
        }
    }, []);

    // Sync <html lang=""> for accessibility and i18n
    useEffect(() => {
        const langMap: Record<LanguageCode, string> = { en: 'en', ru: 'ru', uz: 'uz', cn: 'zh-CN' };
        document.documentElement.lang = langMap[language];
    }, [language]);

    const t = (data: I18nString): string => {
        if (!data) return '';
        if (data[language]) return data[language];
        if (data['en']) return data['en'];
        const keys = Object.keys(data);
        return keys.length > 0 ? data[keys[0]] : '';
    };

    const ui = (key: TranslationKey): string => {
        const entry = translations[key];
        if (!entry) return key;
        return t(entry);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, ui }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
