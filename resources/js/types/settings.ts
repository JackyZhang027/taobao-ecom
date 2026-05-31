export type ShopSetting = {
    shop_name?: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    contact_email?: string;
    contact_phone?: string;
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
