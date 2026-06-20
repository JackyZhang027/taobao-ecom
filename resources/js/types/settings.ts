export type ShopSetting = {
    shop_name?: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    contact_email?: string;
    contact_phone?: string;
    whatsapp_number?: string;
};

export type SocialLink = {
    id: number;
    name: string;
    icon: string;
    url: string;
    is_active: boolean;
    sort_order: number;
};

export type HeroSlide = {
    id: number;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    cta_text: string | null;
    cta_link: string | null;
    sort_order: number;
    is_active: boolean;
    image_url?: string;
};

export type StoreFeature = {
    id: number;
    sort_order: number;
    icon: string;
    title: string;
    description: string;
    is_active: boolean;
};

export type PageTranslationData = {
    title: string;
    content: string;
};

export type FooterSection = 'navigation' | 'help' | 'pages';

export type Page = {
    id: number;
    slug: string;
    footer_section: FooterSection | null;
    sort_order: number;
    is_active: boolean;
    translations: Record<string, PageTranslationData>;
};

export type FooterPage = {
    id: number;
    slug: string;
    title: string;
    footer_section: FooterSection;
    sort_order: number;
};

export type FaqTranslationData = {
    question: string;
    answer: string;
};

export type Faq = {
    id: number;
    sort_order: number;
    is_active: boolean;
    translations: Record<string, FaqTranslationData>;
};
