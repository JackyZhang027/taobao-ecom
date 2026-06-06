import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ProductCard } from '@/components/product-card';
import CustomerLayout from '@/layouts/customer-layout';
import type { Product, Category } from '@/types/product';
import type { HeroSlide, ShopSetting, StoreFeature } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { FEATURE_ICONS } from '@/lib/feature-icons';

interface HomeProps {
    heroSlides: HeroSlide[];
    categories: Category[];
    shopSettings: Record<string, string>;
    products: Product[];
    whatsapp_number?: string;
    storeFeatures: StoreFeature[];
}

export default function Home({ heroSlides, categories, shopSettings, products, whatsapp_number, storeFeatures }: HomeProps) {
    const { t } = useTranslation();

    return (
        <CustomerLayout fullWidth>
            <Head>
                <title>{shopSettings.meta_title || 'Home'}</title>
                <meta name="description" content={shopSettings.meta_description || ''} />
                <meta name="keywords" content={shopSettings.meta_keywords || ''} />
            </Head>

            {/* ── Hero Slider ── */}
            {heroSlides.length > 0 ? (
                <div
                    className="relative w-full h-[560px] md:h-[680px] overflow-hidden bg-[#F8FAFC]"
                    style={{
                        '--swiper-navigation-color': 'rgba(255,255,255,0.85)',
                        '--swiper-navigation-size': '28px',
                        '--swiper-pagination-color': '#2563eb',
                        '--swiper-pagination-bullet-inactive-color': 'rgba(255,255,255,0.6)',
                        '--swiper-pagination-bullet-inactive-opacity': '1',
                    } as React.CSSProperties}
                >
                    <Swiper
                        modules={[Autoplay, Navigation, Pagination]}
                        loop={heroSlides.length > 1}
                        autoplay={heroSlides.length > 1 ? { delay: 5000, disableOnInteraction: false } : false}
                        speed={700}
                        navigation={heroSlides.length > 1}
                        pagination={heroSlides.length > 1 ? { clickable: true } : false}
                        className="w-full h-full"
                    >
                        {heroSlides.map((slide, index) => (
                            <SwiperSlide key={slide.id ?? index}>
                                <div className="relative w-full h-full">
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
                            </SwiperSlide>
                        ))}
                    </Swiper>
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
                    <div
                        style={{
                            '--swiper-navigation-color': '#94a3b8',
                            '--swiper-navigation-size': '22px',
                            '--swiper-pagination-color': '#0f172a',
                            '--swiper-pagination-bullet-inactive-color': '#cbd5e1',
                            '--swiper-pagination-bullet-inactive-opacity': '1',
                        } as React.CSSProperties}
                    >
                        <Swiper
                            modules={[Navigation]}
                            loop={categories.length > 3}
                            navigation={categories.length > 3}
                            slidesPerView={1}
                            spaceBetween={24}
                            breakpoints={{
                                640: { slidesPerView: 2 },
                                768: { slidesPerView: 3 },
                            }}
                            className="pb-10"
                        >
                            {categories.map((category) => (
                                <SwiperSlide key={category.id}>
                                    <Link
                                        href={`/shop?category=${category.slug}`}
                                        className="group cursor-pointer text-center block"
                                    >
                                        <div className="w-full aspect-[4/5] mb-4 overflow-hidden rounded-sm bg-[#EFE9DF] relative">
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
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    <div className="mt-4 flex justify-center">
                        <Button
                            variant="outline"
                            className="bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white px-12 py-3 rounded-none uppercase tracking-wider text-sm font-semibold transition-colors"
                            asChild
                        >
                            <Link href="/categories">{t('home.view_all_categories')}</Link>
                        </Button>
                    </div>
                </section>
            )}

            {/* ── Featured Products ── */}
            <section className="py-16 border-t border-[#DDD6CB]">
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
            <section className="bg-[#EFE9DF] py-16">
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
            {storeFeatures.some(f => f.is_active) && (
                <section className="bg-[#EFE9DF] py-12 border-t border-[#DDD6CB]">
                    <div className="mx-auto max-w-7xl px-4 md:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {storeFeatures.filter(f => f.is_active).map((feature) => {
                                const IconComponent = FEATURE_ICONS[feature.icon];
                                return (
                                    <div key={feature.id} className="flex items-start gap-4">
                                        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                                            {IconComponent && <IconComponent className="h-8 w-8 text-slate-700" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{feature.title}</p>
                                            <p className="text-slate-400 text-xs mt-0.5">{feature.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}
        </CustomerLayout>
    );
}
