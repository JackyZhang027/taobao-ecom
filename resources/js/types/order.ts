export type OrderStatusHistory = {
    id: number;
    order_id: number;
    status: OrderStatus | 'cancelled';
    changed_by: number | null;
    changer?: { id: number; name: string };
    created_at: string;
};

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
    image_url?: string | null;
};

export type Order = {
    id: number;
    order_number: string | null;
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
    courier: string | null;
    tracking_number: string | null;
    created_at: string;
    updated_at: string;
    lines?: OrderLine[];
    status_histories?: OrderStatusHistory[];
    payment?: {
        id: number;
        status: string;
        snap_token: string | null;
        amount: number | null;
        updated_at: string | null;
        gateway_response: {
            payment_type?: string;
            transaction_time?: string;
            settlement_time?: string;
            bank?: string;
            card_type?: string;
            gross_amount?: string;
        } | null;
    };
};
