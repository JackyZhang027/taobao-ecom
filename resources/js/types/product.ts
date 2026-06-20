export type Category = {
    id: number;
    name: string;
    name_id: string | null;
    slug: string;
    parent_id: number | null;
    sort_order: number;
    image_url?: string;
};

// Product-scoped variant group/option types
export type VariantGroup = {
    id: number;
    name: string;
    sort_order: number;
    has_images: boolean;
    options: VariantOption[];
};

export type VariantOption = {
    id: number;
    group_id: number;
    value: string;
    sort_order: number;
    image_url?: string | null;
};

// Denormalized option shape used in storefront variant display
export type VariantOptionDisplay = {
    id: number;
    value: string;
    group_id: number;
    group_name: string;
    image_url?: string | null;
};

export type ProductVariant = {
    id: number;
    product_id: number;
    sku: string | null;
    // Absolute RMB price (not additive on top of product.price)
    price: number;
    price_idr?: number;
    compare_price: number | null;
    compare_price_idr?: number | null;
    delivery_charge_batam?: number;
    delivery_charge_jakarta?: number;
    is_active: boolean;
    sort_order: number;
    image_url?: string | null;
    option_key?: string;
    options?: VariantOptionDisplay[];
    options_data?: VariantOptionDisplay[];
    product?: Product;
};

export type ProductTranslation = {
    id: number;
    product_id: number;
    locale: string;
    name: string;
    description: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
};

export type ProductMedia = {
    id: number;
    url: string;
    thumb: string;
};

export type Product = {
    id: number;
    slug: string;
    thumbnail: string | null;
    price?: number;
    delivery_charge_batam?: number;
    delivery_charge_jakarta?: number;
    delivery_charge_idr?: number;
    show_delivery_charge?: boolean;
    is_active: boolean;
    sort_order: number;
    name: string;
    description: string | null;
    price_idr?: number;
    price_rmb?: number;
    total_batam_idr?: number | null;
    total_jakarta_idr?: number | null;
    is_wishlisted?: boolean;
    variants?: ProductVariant[];
    variantGroups?: VariantGroup[];
    categories?: Category[];
    translations?: ProductTranslation[];
    media?: ProductMedia[];
};
