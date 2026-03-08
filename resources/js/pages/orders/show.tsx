import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Order } from '@/types/order';

interface OrderShowProps {
    order: Order;
    isProduction: boolean;
    clientKey: string | null;
}

export default function OrderShow({ order, isProduction, clientKey }: OrderShowProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();
    const [paying, setPaying] = useState(false);

    const snapToken = order.payment?.snap_token;
    const paymentStatus = order.payment?.status;

    // Re-open Snap modal with existing token
    const confirmAndVisit = async () => {
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            await fetch(`/orders/${order.id}/confirm-payment`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken } });
        } catch (_) { /* proceed even if confirm fails */ }
        router.visit(`/orders/${order.id}`);
    };

    const handlePay = () => {
        if (!snapToken) return;
        setPaying(true);

        const snapOptions = {
            onSuccess: confirmAndVisit,
            onPending: () => router.visit(`/orders/${order.id}`),
            onError: () => { setPaying(false); router.visit(`/orders/${order.id}`); },
            onClose: () => { setPaying(false); },
        };

        const existingScript = document.getElementById('midtrans-snap-script');
        if (existingScript) {
            window.snap.pay(snapToken, snapOptions);
            return;
        }

        const script = document.createElement('script');
        script.id = 'midtrans-snap-script';
        script.src = isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey ?? '');
        script.onload = () => { window.snap.pay(snapToken, snapOptions); };
        document.body.appendChild(script);
    };

    const canPay = order.status === 'pending' && (paymentStatus === 'pending' || paymentStatus === 'deny' || paymentStatus === 'expire') && !!snapToken;

    return (
        <CustomerLayout>
            <Head title={`Order #${order.id}`} />
            <div className="max-w-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('orders.order_number')}{order.id}</h1>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'}`}>
                        {t(`orders.status_${order.status}`)}
                    </span>
                </div>

                {/* Pay Now banner for pending/failed payments */}
                {canPay && (
                    <div className="mb-6 flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
                        <div>
                            <p className="font-semibold text-yellow-800">Payment not completed</p>
                            <p className="text-sm text-yellow-700">Complete your payment to confirm this order.</p>
                        </div>
                        <button
                            onClick={handlePay}
                            disabled={paying}
                            className="ml-4 shrink-0 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60 transition-colors"
                        >
                            {paying ? 'Opening...' : 'Pay Now'}
                        </button>
                    </div>
                )}

                <div className="mb-6 rounded-lg border p-4 space-y-2">
                    <p><span className="font-medium">{t('checkout.recipient_name')}:</span> {order.recipient_name}</p>
                    <p><span className="font-medium">{t('checkout.recipient_phone')}:</span> {order.recipient_phone}</p>
                    <p><span className="font-medium">{t('checkout.shipping_address')}:</span> {order.shipping_address}</p>
                </div>
                <div className="rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left">Product</th>
                                <th className="px-4 py-3 text-right">Price</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.lines?.map((line) => (
                                <tr key={line.id} className="border-b">
                                    <td className="px-4 py-3">
                                        <p>{line.product_name}</p>
                                        {line.variant_name && <p className="text-muted-foreground">{line.variant_name}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-right">{formatIdr(line.unit_price_idr)}</td>
                                    <td className="px-4 py-3 text-right">{line.quantity}</td>
                                    <td className="px-4 py-3 text-right">{formatIdr(line.subtotal_idr)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right font-medium">{t('cart.shipping')}</td>
                                <td className="px-4 py-3 text-right">{formatIdr(order.shipping_idr)}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right font-bold">{t('cart.total')}</td>
                                <td className="px-4 py-3 text-right font-bold">{formatIdr(order.grand_total_idr)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <Link href="/orders" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to Orders</Link>
            </div>
        </CustomerLayout>
    );
}
