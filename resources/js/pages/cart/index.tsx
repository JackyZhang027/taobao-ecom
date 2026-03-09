import { Head, Link } from '@inertiajs/react';
import { Minus, Plus, Trash2, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/hooks/use-cart';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Cart, CartTotals } from '@/types/cart';

interface CartIndexProps {
    cart: Cart;
    totals: CartTotals;
}

export default function CartIndex({ cart, totals }: CartIndexProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();
    const { updateItem, removeItem } = useCart();

    if (cart.items.length === 0) {
        return (
            <CustomerLayout fullWidth>
                <Head title={t('cart.title')} />
                {/* Banner */}
                <div className="bg-[#F8FAFC] py-14 text-center">
                    <h1 className="text-4xl font-bold text-slate-900">{t('cart.title')}</h1>
                    <p className="text-sm text-slate-400 mt-3 flex items-center justify-center gap-1">
                        <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">Home</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-blue-600">Cart</span>
                    </p>
                </div>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <ShoppingBag className="h-20 w-20 text-slate-200 mx-auto mb-6" />
                    <p className="text-2xl font-semibold text-slate-300 mb-2">{t('cart.empty')}</p>
                    <p className="text-slate-400 text-sm mb-8">Add items to your cart and they'll appear here.</p>
                    <Link
                        href="/shop"
                        className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-10 py-3 text-sm font-semibold uppercase tracking-wider transition-colors"
                    >
                        {t('cart.continue_shopping')}
                    </Link>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout fullWidth>
            <Head title={t('cart.title')} />

            {/* Banner */}
            <div className="bg-[#F8FAFC] py-14 text-center">
                <h1 className="text-4xl font-bold text-slate-900">{t('cart.title')}</h1>
                <p className="text-sm text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-blue-600">Cart</span>
                </p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Cart Table */}
                    <div className="lg:col-span-2">
                        {/* Table Header */}
                        <div className="bg-[#F1F5F9] hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-4 font-semibold text-sm text-slate-900 rounded-sm mb-3">
                            <span>Product</span>
                            <span>Price</span>
                            <span>Quantity</span>
                            <span>Subtotal</span>
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-3">
                            {cart.items.map((item) => {
                                // Full item price = product base price + variant addon price
                                const productPrice = (item.variant?.product?.price_idr ?? item.product?.price_idr ?? 0);
                                const variantAddon = item.variant?.price_idr ?? 0;
                                const price = productPrice + variantAddon;
                                const subtotal = price * item.quantity;
                                const productName = item.variant?.product?.name ?? item.product?.name;
                                const thumbnail = item.variant?.product?.thumbnail ?? item.product?.thumbnail;
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white border rounded-sm px-4 py-4 md:px-6 grid md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center"
                                    >
                                        {/* Product */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 shrink-0 rounded-sm overflow-hidden bg-[#F1F5F9]">
                                                {thumbnail ? (
                                                    <img
                                                        src={thumbnail}
                                                        alt={productName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm line-clamp-2">
                                                    {productName}
                                                </p>
                                                {item.variant?.sku && (
                                                    <p className="text-xs text-slate-400 mt-0.5">SKU: {item.variant.sku}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <span className="text-sm text-slate-500 md:hidden font-semibold">Price: </span>
                                            <span className="text-sm text-slate-700">
                                                {price > 0 ? formatIdr(price) : '-'}
                                            </span>
                                        </div>


                                        {/* Quantity */}
                                        <div className="flex items-center gap-2 border border-slate-200 w-fit rounded-sm overflow-hidden">
                                            <button
                                                onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                            >
                                                <Minus className="h-3.5 w-3.5 text-slate-600" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateItem(item.id, item.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                            >
                                                <Plus className="h-3.5 w-3.5 text-slate-600" />
                                            </button>
                                        </div>

                                        {/* Subtotal + Remove */}
                                        <div className="flex items-center justify-between md:justify-end gap-4">
                                            <span className="font-semibold text-slate-900 text-sm">
                                                {subtotal > 0 ? formatIdr(subtotal) : '-'}
                                            </span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-between items-center">
                            <Link
                                href="/shop"
                                className="border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white text-sm px-6 py-2.5 font-medium transition-colors rounded-sm"
                            >
                                {t('cart.continue_shopping')}
                            </Link>
                        </div>
                    </div>

                    {/* Cart Totals */}
                    <div className="bg-[#F1F5F9] rounded-sm p-7 h-fit">
                        <h2 className="text-2xl font-bold text-slate-900 mb-7">Cart Totals</h2>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                <span className="font-medium text-slate-900">{t('cart.subtotal')}</span>
                                <span className="text-slate-500">{formatIdr(totals.subtotal_idr)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                <span className="text-slate-500 text-xs">{t('cart.shipping_note')}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="font-bold text-slate-900">{t('cart.total')}</span>
                                <span className="font-bold text-blue-600 text-base">{formatIdr(totals.subtotal_idr)}</span>
                            </div>
                        </div>

                        <Link
                            href="/checkout"
                            className="mt-7 block w-full bg-slate-900 hover:bg-slate-800 text-white text-center py-4 font-semibold text-sm uppercase tracking-widest transition-colors rounded-sm"
                        >
                            {t('cart.checkout')}
                        </Link>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
