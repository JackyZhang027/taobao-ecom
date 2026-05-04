import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Order } from '@/types/order';

interface CompleteProps {
    order: Order;
    snapToken: string | null;
    clientKey: string | null;
    isProduction: boolean;
}

export default function CheckoutComplete({ order, snapToken, clientKey, isProduction }: CompleteProps) {
    const { formatIdr } = useCurrency();
    const [snapOpened, setSnapOpened] = useState(false);

    useEffect(() => {
        if (!snapToken || !clientKey) return;

        const script = document.createElement('script');
        script.src = isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => {
            setSnapOpened(true);
            window.snap.pay(snapToken, {
                onSuccess: async () => {
                    await fetch(`/orders/${order.id}/confirm-payment`, {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                        },
                    });
                    router.visit(`/orders/${order.id}`);
                },
                onPending: () => router.visit(`/orders/${order.id}`),
                onError: () => router.visit(`/orders/${order.id}`),
                onClose: () => {
                    setSnapOpened(false);
                    router.visit(`/orders/${order.id}`);
                },
            });
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [snapToken, clientKey, isProduction, order.id]);

    const address = [order.street_address, order.city, order.province, order.postal_code]
        .filter(Boolean)
        .join(', ');

    return (
        <CustomerLayout>
            <Head title={`Order #${order.id}`} />
            <div className="max-w-2xl">
                {/* Status banner */}
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="font-semibold text-blue-800">
                        {snapOpened ? 'Payment window opened — complete your payment above.' : 'Preparing payment…'}
                    </p>
                    <p className="text-sm text-blue-700">Order #{order.id} has been created.</p>
                </div>

                {/* Shipping info */}
                <div className="mb-6 rounded-lg border p-4 space-y-1 text-sm">
                    <p className="font-semibold mb-2">Shipping Details</p>
                    <p><span className="text-muted-foreground">Recipient:</span> {order.recipient_name}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {order.recipient_phone}</p>
                    <p><span className="text-muted-foreground">Address:</span> {address}</p>
                    {order.notes && <p><span className="text-muted-foreground">Notes:</span> {order.notes}</p>}
                </div>

                {/* Order lines */}
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
                                        {line.variant_name && (
                                            <p className="text-muted-foreground">{line.variant_name}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">{formatIdr(line.unit_price_idr)}</td>
                                    <td className="px-4 py-3 text-right">{line.quantity}</td>
                                    <td className="px-4 py-3 text-right">{formatIdr(line.subtotal_idr)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right text-muted-foreground">Subtotal</td>
                                <td className="px-4 py-3 text-right">{formatIdr(order.subtotal_idr)}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right text-muted-foreground">Shipping</td>
                                <td className="px-4 py-3 text-right">{formatIdr(order.shipping_idr)}</td>
                            </tr>
                            <tr className="border-t">
                                <td colSpan={3} className="px-4 py-3 text-right font-bold">Total</td>
                                <td className="px-4 py-3 text-right font-bold">{formatIdr(order.grand_total_idr)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </CustomerLayout>
    );
}
