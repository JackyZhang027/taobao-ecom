import type { ProductVariant } from './product';

export type CartItem = {
    id: number;
    cart_id: number;
    product_variant_id: number | null;
    product_id?: number | null;
    quantity: number;
    is_unavailable?: boolean;
    variant?: (Omit<ProductVariant, 'id'> & { id: number | null }) & {
        product?: {
            id: number;
            slug: string;
            thumbnail: string | null;
            name: string;
            price_idr?: number;
        };
    };
    product?: {
        id: number;
        slug: string;
        thumbnail: string | null;
        name: string;
        price_idr?: number;
    };
};

export type Cart = {
    id: number;
    user_id: number | null;
    session_id: string | null;
    items: CartItem[];
};

export type CartTotals = {
    subtotal_idr: number;
    shipping_idr: number;
    shipping_batam_idr: number;
    shipping_jakarta_idr: number;
    grand_total_idr: number;
    item_count: number;
    can_deliver_batam: boolean;
    can_deliver_jakarta: boolean;
};
