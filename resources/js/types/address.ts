export type Address = {
    id: number;
    label: string | null;
    recipient_name: string;
    recipient_phone: string;
    street_address: string;
    city: 'Batam' | 'Jakarta';
    province: string | null;
    postal_code: string | null;
    is_default: boolean;
};
