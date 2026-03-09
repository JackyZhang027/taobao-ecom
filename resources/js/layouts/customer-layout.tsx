import { Link, usePage } from '@inertiajs/react';
import { ShoppingCart, User, Menu, X, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';

interface CustomerLayoutProps {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export default function CustomerLayout({ children, fullWidth = false }: CustomerLayoutProps) {
    const { t } = useTranslation();
    const { auth, cartCount, shopSettings = {} } = usePage().props as any;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Top bar */}
            <div className="bg-slate-900 text-white text-xs py-2 hidden md:block">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {shopSettings.contact_phone && (
                            <span className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3" />
                                {shopSettings.contact_phone}
                            </span>
                        )}
                        {shopSettings.contact_email && (
                            <span className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" />
                                {shopSettings.contact_email}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        {user ? (
                            <>
                                <Link href="/profile" className="hover:text-blue-400 transition-colors">{t('nav.profile')}</Link>
                                <Link href="/wishlist" className="hover:text-blue-400 transition-colors">{t('nav.wishlist')}</Link>
                                <Link href="/orders" className="hover:text-blue-400 transition-colors">{t('nav.orders')}</Link>
                                <Link href="/logout" method="post" as="button" className="hover:text-blue-400 transition-colors">{t('nav.logout')}</Link>
                            </>
                        ) : (
                            <Link href="/login" className="hover:text-blue-400 transition-colors">{t('nav.login')}</Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-slate-900 tracking-wide">
                                {shopSettings.shop_name || 'ShopNow'}
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                {t('nav.home')}
                            </Link>
                            <Link href="/shop" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                {t('nav.shop')}
                            </Link>
                        </div>

                        {/* Icons */}
                        <div className="flex items-center gap-5">
                            <Link href="/cart" className="relative text-slate-700 hover:text-blue-600 transition-colors">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            {user ? (
                                <Link href="/profile" className="hidden md:block text-slate-700 hover:text-blue-600 transition-colors">
                                    <User className="h-5 w-5" />
                                </Link>
                            ) : (
                                <Link href="/login" className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                    <User className="h-4 w-4" />
                                    {t('nav.login')}
                                </Link>
                            )}
                            <button
                                className="md:hidden text-slate-700"
                                onClick={() => setMobileOpen(!mobileOpen)}
                            >
                                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
                        <Link href="/" className="block text-sm font-medium py-2 hover:text-blue-600" onClick={() => setMobileOpen(false)}>{t('nav.home')}</Link>
                        <Link href="/shop" className="block text-sm font-medium py-2 hover:text-blue-600" onClick={() => setMobileOpen(false)}>{t('nav.shop')}</Link>
                        {user ? (
                            <>
                                <Link href="/profile" className="block text-sm font-medium py-2 hover:text-blue-600" onClick={() => setMobileOpen(false)}>{t('nav.profile')}</Link>
                                <Link href="/wishlist" className="block text-sm font-medium py-2 hover:text-blue-600" onClick={() => setMobileOpen(false)}>{t('nav.wishlist')}</Link>
                                <Link href="/orders" className="block text-sm font-medium py-2 hover:text-blue-600" onClick={() => setMobileOpen(false)}>{t('nav.orders')}</Link>
                                <Link href="/logout" method="post" as="button" className="block text-sm font-medium py-2 hover:text-blue-600 text-left w-full" onClick={() => setMobileOpen(false)}>{t('nav.logout')}</Link>
                            </>
                        ) : (
                            <Link href="/login" className="block text-sm font-medium py-2 hover:text-blue-600" onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link>
                        )}
                        <div className="pt-2"><LanguageSwitcher /></div>
                    </div>
                )}
            </nav>

            <main className={fullWidth ? 'w-full' : 'mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'}>
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white mt-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">{shopSettings.shop_name || 'ShopNow'}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Quality products, thoughtfully curated. Fast shipping and easy returns.
                            </p>
                            <div className="flex gap-3 mt-6">
                                {['f', 'in', 't'].map((label) => (
                                    <a key={label} href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 transition-colors text-xs font-bold uppercase">
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Navigation</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
                                <li><Link href="/shop" className="hover:text-blue-400 transition-colors">Shop</Link></li>
                                {user && <li><Link href="/wishlist" className="hover:text-blue-400 transition-colors">{t('nav.wishlist')}</Link></li>}
                                {user && <li><Link href="/orders" className="hover:text-blue-400 transition-colors">My Orders</Link></li>}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Help</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Shipping Policy</span></li>
                                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Returns</span></li>
                                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">FAQ</span></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Contact</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                {shopSettings.contact_email && (
                                    <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />{shopSettings.contact_email}</li>
                                )}
                                {shopSettings.contact_phone && (
                                    <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />{shopSettings.contact_phone}</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                        <p>&copy; {new Date().getFullYear()} {shopSettings.shop_name || 'ShopNow'}. All rights reserved.</p>
                        <p>Trusted shopping, every time.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
