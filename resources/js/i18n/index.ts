import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import id from './locales/id.json';

const SUPPORTED_LOCALES = ['en', 'id'];

function getLocaleFromCookie(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
    const value = match ? decodeURIComponent(match[1]) : undefined;
    return value && SUPPORTED_LOCALES.includes(value) ? value : undefined;
}

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: getLocaleFromCookie(),
        resources: {
            en: { translation: en },
            id: { translation: id },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
