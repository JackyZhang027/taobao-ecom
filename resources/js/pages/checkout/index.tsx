import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronRight, MapPin, Phone, User, FileText } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Cart, CartTotals } from '@/types/cart';

interface CheckoutProps {
    cart: Cart;
    totals: CartTotals;
}

export default function CheckoutIndex({ cart, totals }: CheckoutProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();

    const { data, setData, post, processing, errors } = useForm({
        recipient_name: '',
        recipient_phone: '',
        shipping_address: '',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/checkout', {
            onSuccess: () => toast.success(t('checkout.success') || 'Order placed successfully!'),
            onError: () => toast.error(t('checkout.error') || 'Failed to place order. Please check your details.'),
        });
    };

    return (
        <CustomerLayout fullWidth>
            <Head title={t('checkout.title')} />

            {/* Banner */}
            <div className="bg-[#F8FAFC] py-14 text-center">
                <h1 className="text-4xl font-bold text-slate-900">{t('checkout.title')}</h1>
                <p className="text-sm text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/cart" className="font-medium text-slate-900 hover:text-blue-600">Cart</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-blue-600">Checkout</span>
                </p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid gap-10 lg:grid-cols-5">
                    {/* Billing / Shipping Form */}
                    <form onSubmit={submit} className="lg:col-span-3 space-y-6">
                        <div className="bg-white border rounded-sm p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-7">Billing Details</h2>

                            <div className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-slate-500" />
                                            {t('checkout.recipient_name')}
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.recipient_name}
                                        onChange={(e) => setData('recipient_name', e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-[#FAFAFA]"
                                        required
                                    />
                                    {errors.recipient_name && (
                                        <p className="text-xs text-red-500 mt-1">{errors.recipient_name}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-slate-500" />
                                            {t('checkout.recipient_phone')}
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.recipient_phone}
                                        onChange={(e) => setData('recipient_phone', e.target.value)}
                                        placeholder="+62 812 3456 7890"
                                        className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-[#FAFAFA]"
                                        required
                                    />
                                    {errors.recipient_phone && (
                                        <p className="text-xs text-red-500 mt-1">{errors.recipient_phone}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                            {t('checkout.shipping_address')}
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <textarea
                                        value={data.shipping_address}
                                        onChange={(e) => setData('shipping_address', e.target.value)}
                                        rows={4}
                                        placeholder="Street address, City, Province, Postal code"
                                        className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-[#FAFAFA] resize-none"
                                        required
                                    />
                                    {errors.shipping_address && (
                                        <p className="text-xs text-red-500 mt-1">{errors.shipping_address}</p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                                            {t('checkout.notes')}
                                            <span className="text-slate-400 text-xs font-normal ml-1">(optional)</span>
                                        </span>
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        placeholder="Notes about your order, e.g. special delivery instructions."
                                        className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-[#FAFAFA] resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-4 font-semibold text-sm uppercase tracking-widest transition-colors rounded-sm"
                        >
                            {processing ? 'Placing Order...' : t('checkout.place_order')}
                        </button>
                    </form>

                    {/* Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#F1F5F9] rounded-sm p-7 sticky top-28">
                            <h2 className="text-xl font-bold text-slate-900 mb-7">{t('checkout.order_summary')}</h2>

                            {/* Header */}
                            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 border-b border-slate-200">
                                <span>Product</span>
                                <span>Subtotal</span>
                            </div>

                            {/* Items */}
                            <div className="space-y-4 py-4 border-b border-slate-200">
                                {cart.items.map((item) => {
                                    const price = item.variant?.price_idr ?? 0;
                                    return (
                                        <div key={item.id} className="flex items-center gap-3">
                                            {item.variant?.product?.thumbnail && (
                                                <div className="w-12 h-12 rounded-sm overflow-hidden bg-white shrink-0">
                                                    <img
                                                        src={item.variant.product.thumbnail}
                                                        alt={item.variant.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-900 line-clamp-1">
                                                    {item.variant?.product?.name}
                                                </p>
                                                <p className="text-xs text-slate-400">× {item.quantity}</p>
                                            </div>
                                            <span className="text-sm text-slate-600 shrink-0">
                                                {price > 0 ? formatIdr(price * item.quantity) : '-'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('cart.subtotal')}</span>
                                    <span className="text-slate-900">{formatIdr(totals.subtotal_idr)}</span>
                                </div>
                                <div className="flex justify-between pb-4 border-b border-slate-200">
                                    <span className="text-slate-500">{t('cart.shipping')}</span>
                                    <span className="text-slate-900">{formatIdr(totals.shipping_idr)}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="font-bold text-slate-900">{t('cart.total')}</span>
                                    <span className="font-bold text-blue-600 text-base">{formatIdr(totals.grand_total_idr)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
