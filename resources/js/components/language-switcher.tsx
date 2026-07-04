import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

const setLocaleCookie = (value: string, days = 365): void => {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `locale=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function LanguageSwitcher({ className = '' }: { className?: string }) {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const next = i18n.language === 'en' ? 'id' : 'en';

        setLocaleCookie(next);
        i18n.changeLanguage(next);
        router.reload({ preserveScroll: true });
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`rounded px-2 py-1 text-sm font-medium transition-colors cursor-pointer ${className}`}
        >
            {i18n.language === 'en' ? 'EN' : 'ID'}
        </button>
    );
}
