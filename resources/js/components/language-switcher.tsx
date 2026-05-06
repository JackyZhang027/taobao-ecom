import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const next = i18n.language === 'en' ? 'id' : 'en';
        i18n.changeLanguage(next);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="rounded px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
            {i18n.language === 'en' ? 'EN' : 'ID'}
        </button>
    );
}
