export type Category = {
    id: number;
    name: string;
    name_id: string | null;
    slug: string;
    parent_id: number | null;
    sort_order: number;
    image_url?: string;
};

export type AttributeType = {
    id: number;
    name: string;
    name_id: string | null;
    sort_order: number;
    values?: AttributeValue[];
};

export type AttributeValue = {
    id: number;
    attribute_type_id: number;
    value: string;
    value_id: string | null;
    sort_order: number;
    type?: AttributeType;
};

export type ProductVariant = {
    id: number;
    product_id: number;
    sku: string | null;
    price: number;
    price_idr?: number;
    compare_price: number | null;
    compare_price_idr?: number | null;
    stock: number;
    is_active: boolean;
    sort_order: number;
    image_url?: string | null;
    attributes?: AttributeValue[];
    attribute_values?: AttributeValue[]; // from Laravel JSON serialization
    attributeValues?: AttributeValue[];
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
    delivery_charge?: number;
    delivery_charge_batam?: number;
    delivery_charge_jakarta?: number;
    delivery_charge_idr?: number;
    delivery_charge_batam_idr?: number;
    delivery_charge_jakarta_idr?: number;
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
    categories?: Category[];
    translations?: ProductTranslation[];
    media?: ProductMedia[];
};
