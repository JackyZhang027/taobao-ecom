import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '@/components/product-card';
import CustomerLayout from '@/layouts/customer-layout';
import type { Product, Category } from '@/types/product';
import type { HeroSlide, ShopSetting } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight, Truck, RotateCcw, Shield, Phone } from 'lucide-react';

interface HomeProps {
    heroSlides: HeroSlide[];
    categories: Category[];
    shopSettings: Record<string, string>;
    products: Product[];
    whatsapp_number?: string;
}

export default function Home({ heroSlides, categories, shopSettings, products, whatsapp_number }: HomeProps) {
    const { t } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, [heroSlides.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    }, [heroSlides.length]);

    useEffect(() => {
        resetTimeout();
        if (heroSlides.length > 1) {
            timeoutRef.current = setTimeout(nextSlide, 5000);
        }
        return () => resetTimeout();
    }, [currentSlide, nextSlide, heroSlides.length]);

    return (
        <CustomerLayout fullWidth>
            <Head>
                <title>{shopSettings.meta_title || 'Home'}</title>
                <meta name="description" content={shopSettings.meta_description || ''} />
                <meta name="keywords" content={shopSettings.meta_keywords || ''} />
            </Head>

            {/* ── Hero Slider ── */}
            {heroSlides.length > 0 ? (
                <div className="relative w-full h-[560px] md:h-[680px] overflow-hidden bg-[#F8FAFC] group">
                    <div
                        className="flex h-full transition-transform duration-700 ease-in-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {heroSlides.map((slide, index) => (
                            <div key={index} className="relative w-full h-full flex-shrink-0">
                                {slide.image_url && (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${slide.image_url})` }}
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="container relative flex justify-end items-center h-full px-6 md:px-16 mx-auto">
                                    <div className="bg-white border border-slate-200 shadow-xl p-8 md:p-14 max-w-md rounded-sm">
                                        {slide.subtitle && (
                                            <p className="font-semibold tracking-[0.2em] text-slate-600 mb-3 uppercase text-xs">
                                                {slide.subtitle}
                                            </p>
                                        )}
                                        {slide.title && (
                                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 leading-tight">
                                                {slide.title}
                                            </h1>
                                        )}
                                        {slide.description && (
                                            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                                                {slide.description}
                                            </p>
                                        )}
                                        {slide.cta_text && (
                                            <Button
                                                className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-6 text-sm uppercase tracking-widest font-semibold rounded-none"
                                                asChild
                                            >
                                                <Link href={slide.cta_link || '/shop'}>
                                                    {slide.cta_text}
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {heroSlides.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-3 transition-all z-20 shadow-md cursor-pointer"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-3 transition-all z-20 shadow-md cursor-pointer"
                                aria-label="Next slide"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2.5 z-10">
                                {heroSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentSlide(i)}
                                        className={`transition-all duration-300 cursor-pointer rounded-none ${
                                            currentSlide === i
                                                ? 'bg-blue-600 w-8 h-2'
                                                : 'bg-white/60 hover:bg-white w-2 h-2'
                                        }`}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                /* Fallback hero when no slides */
                <div className="w-full h-[500px] bg-[#F8FAFC] flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm font-semibold tracking-widest text-blue-600 uppercase mb-3">{t('home.new_arrival')}</p>
                        <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
                            {t('home.hero_title')}
                        </h1>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            {t('home.hero_desc')}
                        </p>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-6 rounded-none uppercase tracking-widest text-sm font-semibold" asChild>
                            <Link href="/shop">{t('home.shop_now')}</Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Browse By Category ── */}
            {categories.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 md:px-8 py-16">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-slate-900">{t('home.browse_category')}</h2>
                        <p className="text-slate-400 mt-2 text-sm">{t('home.browse_category_desc')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {categories.map((category) => (
                            <Link key={category.id} href={`/shop?category=${category.slug}`} className="group cursor-pointer text-center">
                                <div className="w-full aspect-[4/5] mb-4 overflow-hidden rounded-sm bg-[#F1F5F9] relative">
                                    {category.image_url ? (
                                        <img
                                            src={category.image_url}
                                            alt={category.name}
                                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex bg-slate-200 items-center justify-center w-full h-full text-5xl font-bold text-slate-300">
                                            {category.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {category.name}
                                </h3>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Featured Products ── */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-4 md:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-slate-900">{t('home.featured_products')}</h2>
                        <p className="text-slate-400 mt-2 text-sm">{t('home.featured_products_desc')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} whatsappNumber={whatsapp_number} />
                        ))}
                    </div>
                    <div className="mt-12 flex justify-center">
                        <Button
                            variant="outline"
                            className="bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white px-12 py-3 rounded-none uppercase tracking-wider text-sm font-semibold transition-colors"
                            asChild
                        >
                            <Link href="/shop">{t('home.view_all')}</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Promo Banner ── */}
            <section className="bg-[#F1F5F9] py-16">
                <div className="mx-auto max-w-7xl px-4 md:px-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">{t('home.limited_offer')}</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-snug mb-4">
                                {t('home.promo_title')}
                            </h2>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                {t('home.promo_desc')}
                            </p>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5 hover:gap-4 transition-all"
                            >
                                {t('home.explore_more')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {products.slice(0, 2).map((product) => (
                                <Link key={product.id} href={`/products/${product.slug}`} className="group">
                                    <div className="aspect-square overflow-hidden rounded-sm bg-[#F1F5F9]">
                                        {product.thumbnail ? (
                                            <img
                                                src={product.thumbnail}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200" />
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Bar ── */}
            <section className="bg-[#F8FAFC] py-12 border-t border-slate-100">
                <div className="mx-auto max-w-7xl px-4 md:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: Truck, title: t('home.feature_delivery'), desc: t('home.feature_delivery_desc') },
                            { icon: RotateCcw, title: t('home.feature_return'), desc: t('home.feature_return_desc') },
                            { icon: Shield, title: t('home.feature_payment'), desc: t('home.feature_payment_desc') },
                            { icon: Phone, title: t('home.feature_support'), desc: t('home.feature_support_desc') },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                                    <Icon className="h-8 w-8 text-slate-700" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{title}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </CustomerLayout>
    );
}
