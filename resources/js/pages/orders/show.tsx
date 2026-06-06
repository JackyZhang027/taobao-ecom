import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Order, OrderStatus, OrderStatusHistory } from '@/types/order';

interface OrderShowProps {
    order: Order;
    isProduction: boolean;
    clientKey: string | null;
}

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

function StatusStepper({ status, histories, t }: { status: OrderStatus; histories?: OrderStatusHistory[]; t: (key: string) => string }) {
    if (status === 'cancelled') {
        return (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <span className="text-sm font-semibold text-red-700">{t('orders.status_cancelled')}</span>
            </div>
        );
    }

    const currentIndex = STEPS.indexOf(status);

    const fmtDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    return (
        <div className="mb-6">
            <ol className="flex items-center w-full">
                {STEPS.map((step, index) => {
                    const isDone = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const historyEntry = histories?.find((h) => h.status === step);

                    return (
                        <li key={step} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                            <div className="flex flex-col items-center">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold
                                    ${isDone ? 'border-green-500 bg-green-500 text-white' :
                                      isCurrent ? 'border-blue-500 bg-blue-500 text-white' :
                                      'border-gray-300 bg-white text-gray-400'}`}
                                >
                                    {isDone ? (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span className={`mt-1 text-xs font-medium
                                    ${isDone ? 'text-green-600' :
                                      isCurrent ? 'text-blue-600' :
                                      'text-gray-400'}`}
                                >
                                    {t(`orders.status_${step}`)}
                                </span>
                                {historyEntry && (isDone || isCurrent) && (
                                    <span className="mt-0.5 text-[10px] text-gray-400 hidden sm:block text-center leading-tight">
                                        {fmtDate(historyEntry.created_at)}
                                    </span>
                                )}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 mt-[-20px]
                                    ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export default function OrderShow({ order, isProduction, clientKey }: OrderShowProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();
    const [paying, setPaying] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [submittingReceipt, setSubmittingReceipt] = useState(false);

    const handleConfirmReceipt = () => {
        setSubmittingReceipt(true);
        router.post(`/orders/${order.id}/confirm-receipt`, {}, {
            onSuccess: () => { setReceiptModalOpen(false); toast.success('Receipt confirmed. Thank you!'); },
            onError: () => { toast.error('Failed to confirm receipt.'); setSubmittingReceipt(false); },
        });
    };

    const snapToken = order.payment?.snap_token;
    const paymentStatus = order.payment?.status;

    const confirmAndVisit = async () => {
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            await fetch(`/orders/${order.id}/confirm-payment`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken } });
        } catch { /* proceed even if confirm fails */ }
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
    const hasTracking = (order.status === 'shipped' || order.status === 'delivered') && (order.courier || order.tracking_number);

    return (
        <CustomerLayout>
            <Head title={order.order_number ?? `Order #${order.id}`} />
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{order.order_number ?? `#${order.id}`}</h1>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`orders.status_${order.status}`)}
                    </span>
                </div>

                <StatusStepper status={order.status} histories={order.status_histories} t={t} />

                {hasTracking && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="font-semibold text-blue-800">{t('orders.tracking_info')}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-blue-700">
                            {order.courier && <span>{t('orders.courier')}: <strong>{order.courier}</strong></span>}
                            {order.tracking_number && <span>{t('orders.tracking_number')}: <strong>{order.tracking_number}</strong></span>}
                        </div>
                    </div>
                )}

                {order.status === 'shipped' && (
                    <>
                        <div className="mb-6 flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
                            <p className="text-sm text-purple-800">{t('orders.confirmReceiptPrompt')}</p>
                            <button
                                onClick={() => setReceiptModalOpen(true)}
                                className="ml-4 shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
                            >
                                {t('orders.confirmReceipt')}
                            </button>
                        </div>

                        <Dialog open={receiptModalOpen} onOpenChange={(v) => { if (!submittingReceipt) setReceiptModalOpen(v); }}>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>{t('orders.confirmReceipt')}</DialogTitle>
                                    <DialogDescription>{t('orders.confirmReceiptMessage')}</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setReceiptModalOpen(false)} disabled={submittingReceipt}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button onClick={handleConfirmReceipt} disabled={submittingReceipt}>
                                        {submittingReceipt ? t('common.loading') : t('common.yes')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                )}

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
                    <p><span className="font-medium">{t('checkout.shipping_address')}:</span> {order.street_address}, {[order.city, order.province, order.postal_code].filter(Boolean).join(', ')}</p>
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
