import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Order, OrderStatus } from '@/types/order';

const STATUS_COLORS: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

interface OrdersProps {
    orders: {
        data: Order[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}

export default function OrdersIndex({ orders }: OrdersProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();

    return (
        <CustomerLayout>
            <Head title={t('orders.title')} />
            <h1 className="mb-6 text-2xl font-bold">{t('orders.title')}</h1>
            <div className="space-y-4">
                {orders.data.map((order) => (
                    <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                        <div>
                            <p className="font-medium">{order.order_number ?? `#${order.id}`}</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                {t(`orders.status_${order.status}`)}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">{formatIdr(order.grand_total_idr)}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </CustomerLayout>
    );
}
