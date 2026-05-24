import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Truck, Hash,
    CreditCard, Calendar, Receipt, ShoppingBag, StickyNote,
    Package, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import type { Order, OrderStatus, OrderStatusHistory } from '@/types/order';

const toastOptions = {
    onSuccess: () => toast.success('Order status updated.'),
    onError: () => toast.error('Failed to update status.'),
};

interface OrderShowProps {
    order: Order & { user?: { id: number; name: string; email: string } };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STATUS_DESC: Record<OrderStatus, string> = {
    pending: 'Awaiting payment',
    confirmed: 'Payment received',
    processing: 'Preparing items',
    shipped: 'On the way',
    delivered: 'Order received',
    cancelled: 'Order cancelled',
};

const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    shipped: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const PAID_STATUSES = ['settlement', 'capture'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PaymentGatewayResponse = NonNullable<NonNullable<Order['payment']>['gateway_response']>;
type PaymentData = NonNullable<Order['payment']>;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    echannel: 'Mandiri Bill',
    qris: 'QRIS',
    gopay: 'GoPay',
    shopeepay: 'ShopeePay',
    dana: 'DANA',
    ovo: 'OVO',
    akulaku: 'Akulaku',
    kredivo: 'Kredivo',
    alfamart: 'Alfamart',
    indomaret: 'Indomaret',
};

const BANK_LABELS: Record<string, string> = {
    bca: 'BCA', bni: 'BNI', bri: 'BRI', mandiri: 'Mandiri',
    permata: 'Permata', cimb: 'CIMB', maybank: 'Maybank', danamon: 'Danamon',
};

function formatPaymentMethod(gw: PaymentGatewayResponse | null | undefined): string | null {
    if (!gw) return null;
    const base = PAYMENT_METHOD_LABELS[gw.payment_type ?? ''] ?? gw.payment_type ?? null;
    if (!base) return null;
    if (gw.payment_type === 'bank_transfer' && gw.bank)
        return `${BANK_LABELS[gw.bank] ?? gw.bank.toUpperCase()} Virtual Account`;
    if (gw.payment_type === 'credit_card' && gw.card_type)
        return `${gw.card_type.charAt(0).toUpperCase() + gw.card_type.slice(1)} Card`;
    return base;
}

function formatPaymentDate(payment: PaymentData | null | undefined): string | null {
    const raw = payment?.gateway_response?.settlement_time
        ?? payment?.gateway_response?.transaction_time
        ?? payment?.updated_at;
    if (!raw) return null;
    try {
        return new Date(raw).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return raw; }
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
    trigger: React.ReactNode;
    title: string;
    description: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
}

function ConfirmDialog({ trigger, title, description, confirmLabel = 'Confirm', destructive = false, onConfirm }: ConfirmDialogProps) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
                        onClick={() => { setOpen(false); onConfirm(); }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Status Stepper ───────────────────────────────────────────────────────────

function StatusStepper({ status, histories }: { status: OrderStatus; histories?: OrderStatusHistory[] }) {
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                <div>
                    <p className="text-sm font-semibold text-red-700">Order Cancelled</p>
                    <p className="text-xs text-red-500">This order has been cancelled and cannot be updated.</p>
                </div>
            </div>
        );
    }

    const currentIndex = STEPS.indexOf(status);

    const fmtDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch { return dateStr; }
    };

    return (
        <Card>
            <CardContent>
                <ol className="flex items-start w-full">
                    {STEPS.map((step, index) => {
                        const isDone = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const historyEntry = histories?.find((h) => h.status === step);
                        return (
                            <li key={step} className={`flex items-start ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                                <div className="flex flex-col items-center gap-1.5 min-w-0">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors
                                        ${isDone ? 'bg-green-500 text-white' :
                                          isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                                          'bg-muted text-muted-foreground'}`}
                                    >
                                        {isDone ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : isCurrent ? (
                                            <Clock className="h-4 w-4" />
                                        ) : index + 1}
                                    </div>
                                    <div className="text-center px-1">
                                        <p className={`text-xs font-semibold leading-tight
                                            ${isDone ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {STATUS_LABELS[step]}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                                            {STATUS_DESC[step]}
                                        </p>
                                        {historyEntry && (isDone || isCurrent) && (
                                            <p className={`text-[10px] font-medium leading-tight mt-1 hidden sm:block ${isDone ? 'text-green-600' : 'text-primary'}`}>
                                                {fmtDate(historyEntry.created_at)}
                                            </p>
                                        )}
                                        {historyEntry && (isDone || isCurrent) && (
                                            <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                                                by {historyEntry.changer?.name ?? 'System'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 mt-[18px] rounded-full transition-colors
                                        ${index < currentIndex ? 'bg-green-400' : 'bg-border'}`}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </CardContent>
        </Card>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <div className="text-sm font-medium text-foreground mt-0.5">{value}</div>
            </div>
        </div>
    );
}

// ─── Ship Modal ───────────────────────────────────────────────────────────────

function ShipModal({ order }: { order: OrderShowProps['order'] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        status: 'shipped' as OrderStatus,
        courier: '',
        tracking_number: '',
    });

    const submit = () => {
        post(`/admin/orders/${order.id}/transition`, {
            ...toastOptions,
            onSuccess: () => {
                toast.success('Order marked as shipped.');
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Truck className="mr-2 h-4 w-4" />
                    Mark as Shipped
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Shipment Details</DialogTitle>
                    <DialogDescription>Enter courier and tracking number before marking this order as shipped.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="ship-courier">
                            Courier <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="ship-courier"
                            value={data.courier}
                            onChange={(e) => setData('courier', e.target.value)}
                            placeholder="e.g. JNE, J&T, SiCepat"
                        />
                        {errors.courier && <p className="text-xs text-red-500">{errors.courier}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="ship-resi">
                            Tracking Number (Resi) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="ship-resi"
                            value={data.tracking_number}
                            onChange={(e) => setData('tracking_number', e.target.value)}
                            placeholder="e.g. JNE001234567"
                        />
                        {errors.tracking_number && <p className="text-xs text-red-500">{errors.tracking_number}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        disabled={processing || !data.courier.trim() || !data.tracking_number.trim()}
                        onClick={submit}
                    >
                        Confirm Shipment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Order Actions ────────────────────────────────────────────────────────────

function OrderActions({ order }: { order: OrderShowProps['order'] }) {
    const isPaid = PAID_STATUSES.includes(order.payment?.status ?? '');
    const { status } = order;

    const transition = (nextStatus: OrderStatus) => {
        router.post(`/admin/orders/${order.id}/transition`, { status: nextStatus }, toastOptions);
    };

    const CancelBtn = (
        <ConfirmDialog
            trigger={
                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                    Cancel Order
                </Button>
            }
            title="Cancel this order?"
            description="This action cannot be undone. The order will be permanently cancelled."
            confirmLabel="Yes, Cancel Order"
            destructive
            onConfirm={() => transition('cancelled')}
        />
    );

    if (status === 'delivered') {
        return (
            <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">Order delivered</span>
            </div>
        );
    }

    if (status === 'cancelled') return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {status === 'pending' && (
                <>
                    <span className="flex items-center gap-1.5 text-xs text-yellow-700">
                        <Clock className="h-3.5 w-3.5" />
                        Awaiting payment — confirms automatically
                    </span>
                    {CancelBtn}
                </>
            )}

            {status === 'confirmed' && (
                <>
                    <ConfirmDialog
                        trigger={<Button size="sm">Start Processing</Button>}
                        title="Start processing this order?"
                        description="Items will be prepared and sourced for this order."
                        confirmLabel="Yes, Start Processing"
                        onConfirm={() => transition('processing')}
                    />
                    {CancelBtn}
                </>
            )}

            {status === 'processing' && (
                <>
                    <ShipModal order={order} />
                    {CancelBtn}
                </>
            )}

            {status === 'shipped' && (
                <div className="flex items-center gap-2 text-purple-700">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm font-semibold">Awaiting customer confirmation</span>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrderShow({ order }: OrderShowProps) {
    const { formatIdr } = useCurrency();

    const paymentStatus = order.payment?.status ?? 'unpaid';
    const isPaid = PAID_STATUSES.includes(paymentStatus);
    const paymentMethod = formatPaymentMethod(order.payment?.gateway_response);
    const paymentDate = formatPaymentDate(order.payment);

    const PAYMENT_STATUS_LABELS: Record<string, string> = {
        settlement: 'Paid', capture: 'Paid',
        pending: 'Awaiting Payment', deny: 'Denied',
        expire: 'Expired', cancel: 'Cancelled', refund: 'Refunded',
    };
    const PAYMENT_STATUS_COLORS: Record<string, string> = {
        settlement: 'bg-green-100 text-green-700 border-green-200',
        capture: 'bg-green-100 text-green-700 border-green-200',
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        deny: 'bg-red-100 text-red-700 border-red-200',
        expire: 'bg-red-100 text-red-700 border-red-200',
        cancel: 'bg-red-100 text-red-700 border-red-200',
        refund: 'bg-orange-100 text-orange-700 border-orange-200',
    };

    return (
        <AdminLayout>
            <Head title={order.order_number ?? `Order #${order.id}`} />

            {/* ── Page Header ── */}
            <div className="mb-6">
                <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Orders
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight">{order.order_number ?? `#${order.id}`}</h1>
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${ORDER_STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {order.status}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[paymentStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Placed on {new Date(order.created_at).toLocaleString('id-ID', {
                                day: '2-digit', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                            {order.user && ` · ${order.user.name}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{formatIdr(order.grand_total_idr)}</p>
                        <p className="text-xs text-muted-foreground">{order.lines?.length ?? 0} item(s)</p>
                    </div>
                </div>
            </div>

            {/* ── Status Stepper ── */}
            <div className="mb-6">
                <StatusStepper status={order.status} histories={order.status_histories} />
            </div>

            {/* ── Main Grid ── */}
            <div className="grid gap-6 lg:grid-cols-3">

                {/* Left: Actions + Order Lines + Notes */}
                <div className="space-y-6 lg:col-span-2">
                    <OrderActions order={order} />
                    <Card>
                        <CardHeader className="pb-0">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-base">Order Items</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 mt-4">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-y bg-muted/40">
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {order.lines?.map((line) => (
                                        <tr key={line.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-medium leading-snug">{line.product_name}</p>
                                                {line.variant_name && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">{line.variant_name}</p>
                                                )}
                                                <p className="mt-0.5 text-xs text-muted-foreground font-mono">{line.sku}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right tabular-nums">{formatIdr(line.unit_price_idr)}</td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                                                    {line.quantity}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-semibold tabular-nums">{formatIdr(line.subtotal_idr)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>

                            {/* Totals */}
                            <div className="border-t px-5 py-4 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{formatIdr(order.subtotal_idr)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Shipping</span>
                                    <span className="tabular-nums">{formatIdr(order.shipping_idr)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-base font-bold">
                                    <span>Total</span>
                                    <span className="tabular-nums">{formatIdr(order.grand_total_idr)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {order.notes && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base">Order Notes</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Sidebar */}
                <div className="space-y-4">

                    {/* Customer */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow icon={User} label="Name" value={order.user?.name ?? order.recipient_name} />
                            {order.user?.email && (
                                <InfoRow icon={Mail} label="Email" value={
                                    <a href={`mailto:${order.user.email}`} className="text-primary hover:underline">
                                        {order.user.email}
                                    </a>
                                } />
                            )}
                            <InfoRow icon={Phone} label="Phone" value={order.recipient_phone} />
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow icon={User} label="Recipient" value={order.recipient_name} />
                            <InfoRow
                                icon={MapPin}
                                label="Address"
                                value={
                                    <span>
                                        {order.street_address}<br />
                                        {[order.city, order.province, order.postal_code].filter(Boolean).join(', ')}
                                    </span>
                                }
                            />
                            {(order.courier || order.tracking_number) && (
                                <>
                                    <InfoRow icon={Truck} label="Courier" value={order.courier ?? '—'} />
                                    <InfoRow icon={Hash} label="Resi" value={
                                        <span className="font-mono text-sm">{order.tracking_number ?? '—'}</span>
                                    } />
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Payment</CardTitle>
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                                    ${PAYMENT_STATUS_COLORS[paymentStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {paymentMethod && (
                                <InfoRow icon={CreditCard} label="Method" value={paymentMethod} />
                            )}
                            {order.payment?.amount != null && (
                                <InfoRow icon={Receipt} label="Amount" value={
                                    <span className={`font-semibold ${isPaid ? 'text-green-700' : ''}`}>
                                        {formatIdr(order.payment.amount)}
                                    </span>
                                } />
                            )}
                            {paymentDate && (
                                <InfoRow icon={Calendar} label="Date" value={paymentDate} />
                            )}
                            {order.payment?.id && (
                                <InfoRow icon={Package} label="Payment ID" value={
                                    <span className="font-mono text-xs">#{order.payment.id}</span>
                                } />
                            )}
                            {!order.payment && (
                                <p className="text-sm text-muted-foreground">No payment record yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
