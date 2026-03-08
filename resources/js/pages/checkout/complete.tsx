import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import CustomerLayout from '@/layouts/customer-layout';
import type { Order } from '@/types/order';

interface CompleteProps {
    order: Order;
    snapToken: string | null;
    clientKey: string | null;
    isProduction: boolean;
}

export default function CheckoutComplete({ order, snapToken, clientKey, isProduction }: CompleteProps) {
    useEffect(() => {
        if (!snapToken || !clientKey) return;

        const script = document.createElement('script');
        script.src = isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => {
            window.snap.pay(snapToken, {
                onSuccess: async () => {
                    await fetch(`/orders/${order.id}/confirm-payment`, { method: 'POST', headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' } });
                    router.visit(`/orders/${order.id}`);
                },
                onPending: () => router.visit(`/orders/${order.id}`),
                onError: () => router.visit('/checkout'),
                onClose: () => router.visit(`/orders/${order.id}`),
            });
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [snapToken, clientKey, isProduction, order.id]);

    return (
        <CustomerLayout>
            <Head title="Processing Payment" />
            <div className="py-20 text-center">
                <h1 className="text-2xl font-bold">Processing Payment...</h1>
                <p className="mt-2 text-muted-foreground">Order #{order.id}</p>
            </div>
        </CustomerLayout>
    );
}
