import { Link, usePage } from '@inertiajs/react';
import { ShoppingCart, User, Menu, X, Heart, Package, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { SocialIcon } from '@/lib/social-icons';
import type { FooterPage, SocialLink } from '@/types/settings';

interface CustomerLayoutProps {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export default function CustomerLayout({ children, fullWidth = false }: CustomerLayoutProps) {
    const { t } = useTranslation();
    const { auth, cartCount, wishlistCount, shopSettings = {}, socialLinks = [], footerPages = [] } = usePage().props as any;
    const { url } = usePage();
    const user = auth?.user;
    const navigationPages = (footerPages as FooterPage[]).filter((page) => page.footer_section === 'navigation');
    const helpPages = (footerPages as FooterPage[]).filter((page) => page.footer_section === 'help');
    const pagesSectionPages = (footerPages as FooterPage[]).filter((page) => page.footer_section === 'pages');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="storefront min-h-screen flex flex-col bg-[#F8F5EF] text-slate-900 font-sans">
            {/* Main Navbar */}
            <nav className="bg-[#2d2d2d] border-b border-[#444] sticky top-0 z-50 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-[#c8c8ca] tracking-wide">
                                {shopSettings.shop_name || 'ShopNow'}
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link
                                href="/"
                                className={`text-sm font-medium transition-colors ${url === '/' ? 'text-white border-b-2 border-[#c8c8ca] pb-0.5' : 'text-[#c8c8ca] hover:text-white'}`}
                            >
                                {t('nav.home')}
                            </Link>
                            <Link
                                href="/shop"
                                className={`text-sm font-medium transition-colors ${url.startsWith('/shop') ? 'text-white border-b-2 border-[#c8c8ca] pb-0.5' : 'text-[#c8c8ca] hover:text-white'}`}
                            >
                                {t('nav.shop')}
                            </Link>
                        </div>

                        {/* Icons */}
                        <div className="flex items-center gap-5">
                            <LanguageSwitcher className="text-[#c8c8ca] hover:text-white" />
                            <Link href="/cart" className="relative text-[#c8c8ca] hover:text-white transition-colors">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            {user && (
                                <Link href="/wishlist" className="relative hidden md:block text-[#c8c8ca] hover:text-white transition-colors">
                                    <Heart className="h-5 w-5" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>
                            )}
                            {user ? (
                                <div className="relative hidden md:block" ref={profileRef}>
                                    <button
                                        onClick={() => setProfileOpen(v => !v)}
                                        className="cursor-pointer text-[#c8c8ca] hover:text-white transition-colors"
                                    >
                                        <User className="h-5 w-5" />
                                    </button>
                                    {profileOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-44 rounded-lg bg-white shadow-lg py-1 z-50">
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                                onClick={() => setProfileOpen(false)}
                                            >
                                                <User className="h-4 w-4 text-slate-400" />
                                                My Profile
                                            </Link>
                                            <Link
                                                href="/orders"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                                onClick={() => setProfileOpen(false)}
                                            >
                                                <Package className="h-4 w-4 text-slate-400" />
                                                My Orders
                                            </Link>
                                            <Link
                                                href="/logout"
                                                method="post"
                                                as="button"
                                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                                onClick={() => setProfileOpen(false)}
                                            >
                                                <LogOut className="h-4 w-4 text-slate-400" />
                                                {t('nav.logout')}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link href="/login" className="hidden md:flex items-center gap-1 text-sm font-medium text-[#c8c8ca] hover:text-white transition-colors">
                                    <User className="h-4 w-4" />
                                    {t('nav.login')}
                                </Link>
                            )}
                            <button
                                className="md:hidden text-[#c8c8ca]"
                                onClick={() => setMobileOpen(!mobileOpen)}
                            >
                                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-[#444] bg-[#2e2e2e] px-4 py-4 space-y-3">
                        <Link href="/" className={`block text-sm font-medium py-2 transition-colors hover:text-white ${url === '/' ? 'text-white font-bold' : 'text-[#c8c8ca]'}`} onClick={() => setMobileOpen(false)}>{t('nav.home')}</Link>
                        <Link href="/shop" className={`block text-sm font-medium py-2 transition-colors hover:text-white ${url.startsWith('/shop') ? 'text-white font-bold' : 'text-[#c8c8ca]'}`} onClick={() => setMobileOpen(false)}>{t('nav.shop')}</Link>
                        {user ? (
                            <>
                                <Link href="/profile" className="block text-sm font-medium py-2 text-[#c8c8ca] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t('nav.profile')}</Link>
                                <Link href="/wishlist" className="block text-sm font-medium py-2 text-[#c8c8ca] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t('nav.wishlist')}</Link>
                                <Link href="/orders" className="block text-sm font-medium py-2 text-[#c8c8ca] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t('nav.orders')}</Link>
                                <Link href="/logout" method="post" as="button" className="block text-sm font-medium py-2 text-[#c8c8ca] hover:text-white transition-colors text-left w-full" onClick={() => setMobileOpen(false)}>{t('nav.logout')}</Link>
                            </>
                        ) : (
                            <Link href="/login" className="block text-sm font-medium py-2 text-[#c8c8ca] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link>
                        )}
                    </div>
                )}
            </nav>

            <main className={fullWidth ? 'w-full flex-1' : 'w-full mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8'}>
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                    <div className={`grid grid-cols-1 gap-10 ${pagesSectionPages.length > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">{shopSettings.shop_name || 'ShopNow'}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {shopSettings.description || t('footer.tagline')}
                            </p>
                            {(socialLinks as SocialLink[]).length > 0 && (
                                <div className="flex gap-3 mt-6">
                                    {(socialLinks as SocialLink[]).map((link) => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={link.name}
                                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 transition-colors"
                                        >
                                            <SocialIcon icon={link.icon} className="w-4 h-4" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">{t('footer.navigation')}</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/" className="hover:text-blue-400 transition-colors">{t('nav.home')}</Link></li>
                                <li><Link href="/shop" className="hover:text-blue-400 transition-colors">{t('nav.shop')}</Link></li>
                                {user && <li><Link href="/wishlist" className="hover:text-blue-400 transition-colors">{t('nav.wishlist')}</Link></li>}
                                {user && <li><Link href="/orders" className="hover:text-blue-400 transition-colors">{t('footer.my_orders')}</Link></li>}
                                {navigationPages.map((page) => (
                                    <li key={page.id}><Link href={`/pages/${page.slug}`} className="hover:text-blue-400 transition-colors">{page.title}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">{t('footer.help')}</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/faq" className="hover:text-blue-400 transition-colors">{t('footer.faq')}</Link></li>
                                {helpPages.map((page) => (
                                    <li key={page.id}><Link href={`/pages/${page.slug}`} className="hover:text-blue-400 transition-colors">{page.title}</Link></li>
                                ))}
                            </ul>
                        </div>
                        {pagesSectionPages.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">{t('footer.pages')}</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    {pagesSectionPages.map((page) => (
                                        <li key={page.id}><Link href={`/pages/${page.slug}`} className="hover:text-blue-400 transition-colors">{page.title}</Link></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">{t('footer.contact')}</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                {(socialLinks as SocialLink[]).map((link) => (
                                    <li key={link.id} className="flex items-start gap-2">
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                                        >
                                            <SocialIcon icon={link.icon} className="h-4 w-4 shrink-0 text-blue-400" />
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                        <p>&copy; {new Date().getFullYear()} {shopSettings.shop_name || 'ShopNow'}. {t('footer.all_rights')}</p>
                        <p>{t('footer.trusted')}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
