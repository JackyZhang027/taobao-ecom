import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Order } from '@/types/order';

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
                    <div key={order.id} className="rounded-lg border p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t('orders.order_number')}{order.id}</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium
                                ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'}`}>
                                {t(`orders.status_${order.status}`)}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">{formatIdr(order.grand_total_idr)}</p>
                            <Link href={`/orders/${order.id}`} className="text-sm text-primary hover:underline">
                                {t('orders.view')}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </CustomerLayout>
    );
}
