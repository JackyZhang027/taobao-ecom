import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const next = i18n.language === 'en' ? 'id' : 'en';
        i18n.changeLanguage(next);
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
