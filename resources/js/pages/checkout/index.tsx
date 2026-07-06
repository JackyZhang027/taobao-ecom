import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronRight, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AddressCard from '@/components/address-card';
import AddressPickerSheet from '@/components/address-picker-sheet';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Address } from '@/types/address';
import type { Cart, CartTotals } from '@/types/cart';

interface CheckoutProps {
    cart: Cart;
    totals: CartTotals;
    whatsapp_number: string;
    addresses: Address[];
}

const inputClass = 'w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors bg-[#FAFAFA]';

export default function CheckoutIndex({ cart, totals, addresses }: CheckoutProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();

    const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
    const [pickerOpen, setPickerOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        address_id: defaultAddress ? String(defaultAddress.id) : '',
        notes: '',
    });

    // Keep the selection valid if the address it points to was edited/deleted
    // while the picker sheet was open (addresses prop refreshes underneath us).
    useEffect(() => {
        if (data.address_id && !addresses.some((a) => String(a.id) === data.address_id)) {
            const fallback = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
            setData('address_id', fallback ? String(fallback.id) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addresses]);

    const handleSelectAddress = (address: Address) => {
        setData('address_id', String(address.id));
        router.reload({ data: { city: address.city }, only: ['totals'] });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/checkout', {
            onSuccess: () => toast.success(t('checkout.success')),
            onError: () => toast.error(t('checkout.error')),
        });
    };

    const selectedAddress = addresses.find((a) => String(a.id) === data.address_id) ?? null;
    const currentCity = selectedAddress?.city ?? 'Batam';
    const canDeliver = currentCity === 'Jakarta' ? totals.can_deliver_jakarta : totals.can_deliver_batam;

    const itemPrice = (item: Cart['items'][0]) => item.variant?.price_idr ?? 0;

    return (
        <CustomerLayout fullWidth>
            <Head title={t('checkout.title')} />

            {/* Banner */}
            <div className="bg-[#F8FAFC] py-14 text-center">
                <h1 className="text-4xl font-bold text-slate-900">{t('checkout.title')}</h1>
                <p className="text-sm text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">{t('nav.home')}</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/cart" className="font-medium text-slate-900 hover:text-blue-600">{t('nav.cart')}</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-blue-600">{t('checkout.title')}</span>
                </p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid gap-10 lg:grid-cols-5">
                    {/* Delivery Address */}
                    <form onSubmit={submit} className="lg:col-span-3 space-y-6">
                        <div className="bg-white border rounded-sm p-8">
                            <div className="mb-7 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900">{t('checkout.shipping_address')}</h2>
                                {selectedAddress && (
                                    <button
                                        type="button"
                                        onClick={() => setPickerOpen(true)}
                                        className="text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        {t('checkout.change_address')}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-5">
                                {selectedAddress ? (
                                    <AddressCard address={selectedAddress} />
                                ) : (
                                    <div className="py-6 text-center">
                                        <p className="mb-4 text-sm text-slate-500">{t('checkout.no_address_selected')}</p>
                                        <Button type="button" onClick={() => setPickerOpen(true)}>
                                            {t('addresses.add_new')}
                                        </Button>
                                    </div>
                                )}
                                {errors.address_id && <p className="text-xs text-red-500 mt-1">{errors.address_id}</p>}
                                {selectedAddress && !canDeliver && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {t('checkout.delivery_unavailable', { city: currentCity })}
                                    </p>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                                            {t('checkout.notes')}
                                            <span className="text-slate-400 text-xs font-normal ml-1">{t('common.optional')}</span>
                                        </span>
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        placeholder={t('checkout.notes_placeholder')}
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !selectedAddress || !canDeliver}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 font-semibold text-sm uppercase tracking-widest transition-colors rounded-sm"
                        >
                            {processing ? t('checkout.placing_order') : t('checkout.place_order')}
                        </button>
                    </form>

                    {/* Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#F1F5F9] rounded-sm p-7 sticky top-28">
                            <h2 className="text-xl font-bold text-slate-900 mb-7">{t('checkout.order_summary')}</h2>

                            {/* Header */}
                            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 border-b border-slate-200">
                                <span>{t('orders.product')}</span>
                                <span>{t('cart.subtotal')}</span>
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
                                    <span className="text-slate-500">{t('cart.shipping')} ({currentCity})</span>
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

            <AddressPickerSheet
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                addresses={addresses}
                selectedId={data.address_id}
                onSelect={handleSelectAddress}
                startInForm={addresses.length === 0}
            />
        </CustomerLayout>
    );
}
