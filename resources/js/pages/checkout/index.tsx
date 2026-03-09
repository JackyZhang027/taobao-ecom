import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronRight, MapPin, Phone, User, FileText, Building2 } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Cart, CartTotals } from '@/types/cart';

interface CheckoutProps {
    cart: Cart;
    totals: CartTotals;
    whatsapp_number: string;
}

const inputClass = 'w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-[#FAFAFA]';

export default function CheckoutIndex({ cart, totals, whatsapp_number }: CheckoutProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();

    const { data, setData, post, processing, errors } = useForm({
        recipient_name: '',
        recipient_phone: '',
        street_address: '',
        city: 'Batam' as 'Batam' | 'Jakarta',
        province: 'Kepulauan Riau',
        postal_code: '',
        notes: '',
    });

    const cityProvinceMap: Record<'Batam' | 'Jakarta', string> = {
        Batam: 'Kepulauan Riau',
        Jakarta: 'DKI Jakarta',
    };

    const handleCityChange = (city: 'Batam' | 'Jakarta') => {
        setData((prev) => ({ ...prev, city, province: cityProvinceMap[city] }));
        // Reload totals from server for the new city
        router.reload({ data: { city }, only: ['totals'], preserveScroll: true, preserveState: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/checkout', {
            onSuccess: () => toast.success(t('checkout.success') || 'Order placed successfully!'),
            onError: () => toast.error(t('checkout.error') || 'Failed to place order. Please check your details.'),
        });
    };

    // Per-item price for order summary sidebar
    const itemPrice = (item: Cart['items'][0]) => {
        const productPrice = item.variant?.product?.price_idr ?? item.product?.price_idr ?? 0;
        return productPrice + (item.variant?.price_idr ?? 0);
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
                                        className={inputClass}
                                        required
                                    />
                                    {errors.recipient_name && <p className="text-xs text-red-500 mt-1">{errors.recipient_name}</p>}
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
                                        className={inputClass}
                                        required
                                    />
                                    {errors.recipient_phone && <p className="text-xs text-red-500 mt-1">{errors.recipient_phone}</p>}
                                </div>

                                {/* Street Address */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                            Street Address
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.street_address}
                                        onChange={(e) => setData('street_address', e.target.value)}
                                        placeholder="Jl. Sudirman No. 12"
                                        className={inputClass}
                                        required
                                    />
                                    {errors.street_address && <p className="text-xs text-red-500 mt-1">{errors.street_address}</p>}
                                </div>

                                {/* City selector */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                            City / Delivery Location
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <div className="flex gap-3">
                                        {(['Batam', 'Jakarta'] as const).map((city) => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => handleCityChange(city)}
                                                className={`flex-1 py-3 rounded-sm border text-sm font-semibold transition-colors
                                                    ${data.city === city
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                                </div>

                                {/* Province + Postal Code */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-900 mb-1.5">Province</label>
                                        <input
                                            type="text"
                                            value={data.province}
                                            readOnly
                                            className={`${inputClass} bg-slate-100 cursor-default`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-900 mb-1.5">Postal Code</label>
                                        <input
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder="29432"
                                            className={inputClass}
                                        />
                                    </div>
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
                                        className={`${inputClass} resize-none`}
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
                                    const price = itemPrice(item);
                                    const thumbnail = item.variant?.product?.thumbnail ?? item.product?.thumbnail;
                                    const name = item.variant?.product?.name ?? item.product?.name;
                                    return (
                                        <div key={item.id} className="flex items-center gap-3">
                                            {thumbnail && (
                                                <div className="w-12 h-12 rounded-sm overflow-hidden bg-white shrink-0">
                                                    <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-900 line-clamp-1">{name}</p>
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
                                    <span className="text-slate-500">{t('cart.shipping')} ({data.city})</span>
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
