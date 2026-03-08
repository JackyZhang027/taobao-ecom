import { usePage } from '@inertiajs/react';

export function useCurrency() {
    const { exchangeRate } = usePage().props as { exchangeRate: number };

    const formatIdr = (amount: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(amount));

    return { formatIdr, exchangeRate };
}
