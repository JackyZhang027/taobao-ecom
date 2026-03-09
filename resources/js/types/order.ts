export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export type OrderLine = {
    id: number;
    order_id: number;
    product_variant_id: number | null;
    product_name: string;
    variant_name: string | null;
    sku: string;
    unit_price_idr: number;
    quantity: number;
    subtotal_idr: number;
};

export type Order = {
    id: number;
    user_id: number;
    status: OrderStatus;
    subtotal_idr: number;
    shipping_idr: number;
    grand_total_idr: number;
    exchange_rate_snapshot: number;
    recipient_name: string;
    recipient_phone: string;
    street_address: string;
    city: string;
    province: string | null;
    postal_code: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    lines?: OrderLine[];
    payment?: {
        id: number;
        status: string;
        snap_token: string | null;
    };
};
