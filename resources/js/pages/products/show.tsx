import { Head, Link } from '@inertiajs/react';
import DOMPurify from 'dompurify';
import { ChevronLeft, ChevronRight, Minus, Plus, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { VariantSelector } from '@/components/variant-selector';
import { useCart } from '@/hooks/use-cart';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Product, ProductMedia } from '@/types/product';

interface ShowProps {
    product: Product;
    whatsapp_number: string | null;
}

export default function ProductShow({ product, whatsapp_number }: ShowProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();
    const { addItem, addProduct } = useCart();

    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
    const [qty, setQty] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
    const hasVariants = (product.variants?.length ?? 0) > 0;

    // Active variants matching the current (possibly partial) option selection
    const activeVariants = product.variants?.filter((v) => v.is_active) ?? [];
    const matchingVariants =
        Object.keys(selectedOptions).length > 0
            ? activeVariants.filter((v) =>
                  Object.entries(selectedOptions).every(([gId, oId]) =>
                      (v.options ?? []).some((o) => o.group_id === Number(gId) && o.id === oId),
                  ),
              )
            : activeVariants;

    const lowestPriceVariant =
        matchingVariants.length > 0
            ? matchingVariants.reduce((min, v) => ((v.price_idr ?? 0) < (min.price_idr ?? 0) ? v : min))
            : null;

    // Exact match when all groups selected, otherwise lowest of matching set
    const displayPrice = hasVariants
        ? (selectedVariant?.price_idr ?? lowestPriceVariant?.price_idr ?? null)
        : (product.price_idr ?? null);

    const comparePrice = selectedVariant?.compare_price_idr ?? null;

    const activeSourceVariant = selectedVariant ?? lowestPriceVariant;
    const activeBatamCharge = hasVariants
        ? (activeSourceVariant?.delivery_charge_batam ?? 0)
        : (product.delivery_charge_batam ?? 0);

    const activeJakartaCharge = hasVariants
        ? (activeSourceVariant?.delivery_charge_jakarta ?? 0)
        : (product.delivery_charge_jakarta ?? 0);

    const noDeliveryAvailable = activeBatamCharge === 0 && activeJakartaCharge === 0;

    // Build displayable images: product media first, then per-option images not already present
    const productImages: ProductMedia[] =
        product.media && product.media.length > 0
            ? product.media
            : product.thumbnail
              ? [{ id: 0, url: product.thumbnail, thumb: product.thumbnail }]
              : [];

    // Map option id → image index for gallery switching on option select
    const optionImageMap = new Map<number, number>();
    const images: ProductMedia[] = [...productImages];
    const seenOptionIds = new Set<number>();
    product.variants?.forEach((variant) => {
        (variant.options ?? []).forEach((opt) => {
            if (opt.image_url && !seenOptionIds.has(opt.id)) {
                seenOptionIds.add(opt.id);
                const existingIdx = images.findIndex((img) => img.url === opt.image_url);
                if (existingIdx >= 0) {
                    optionImageMap.set(opt.id, existingIdx);
                } else {
                    optionImageMap.set(opt.id, images.length);
                    images.push({ id: -(opt.id + 10000), url: opt.image_url!, thumb: opt.image_url! });
                }
            }
        });
    });

    function handleVariantChange(variantId: number | null) {
        setSelectedVariantId(variantId);
    }

    function handleOptionSelect(_groupId: number, optionId: number) {
        if (optionImageMap.has(optionId)) {
            setActiveImageIndex(optionImageMap.get(optionId)!);
        }
    }

    function handleImageChange(index: number) {
        setActiveImageIndex(index);
    }

    const activeImage = images[activeImageIndex];

    function prevImage(e?: React.MouseEvent) {
        e?.stopPropagation();
        setActiveImageIndex((i) => Math.max(0, i - 1));
    }

    function nextImage(e?: React.MouseEvent) {
        e?.stopPropagation();
        setActiveImageIndex((i) => Math.min(images.length - 1, i + 1));
    }

    const hasShipping = activeBatamCharge > 0 || activeJakartaCharge > 0 || !!whatsapp_number;
    const showDeliveryColumn = !!product.show_delivery_charge;
    const shippingGridCols = showDeliveryColumn ? 'grid-cols-3' : 'grid-cols-2';

    return (
        <CustomerLayout fullWidth>
            <Head title={product.name} />

            {/* Breadcrumb banner */}
            <div className="bg-[#F8FAFC] py-10 text-center">
                <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
                <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1">
                    <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">{t('nav.home')}</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/shop" className="font-medium text-slate-900 hover:text-blue-600">{t('nav.shop')}</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-blue-600 line-clamp-1 max-w-[200px]">{product.name}</span>
                </p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid gap-12 lg:grid-cols-2">
                    {/* ── Image Gallery ── */}
                    <div className="space-y-3">
                        {/* Main image */}
                        <div
                            className="relative w-full aspect-square rounded-sm overflow-hidden bg-[#F1F5F9] cursor-zoom-in group"
                            onClick={() => images.length > 0 && setLightboxOpen(true)}
                        >
                            {activeImage ? (
                                <img
                                    src={activeImage.url}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <span className="text-slate-400 text-sm">{t('product.no_image')}</span>
                                </div>
                            )}
                            {images.length > 0 && (
                                <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="h-3.5 w-3.5" />
                                    {t('product.zoom')}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {images.map((img, i) => (
                                    <button
                                        key={img.id}
                                        onClick={() => handleImageChange(i)}
                                        className={`shrink-0 w-16 h-16 rounded-sm overflow-hidden border-2 transition-colors ${
                                            i === activeImageIndex
                                                ? 'border-blue-600'
                                                : 'border-transparent hover:border-slate-300'
                                        }`}
                                    >
                                        <img
                                            src={img.thumb || img.url}
                                            alt={t('product.thumbnail_alt', { n: i + 1 })}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Product Info ── */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
                            {product.categories && product.categories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {product.categories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/shop?category=${cat.slug}`}
                                            className="text-xs bg-[#F1F5F9] text-slate-600 px-2.5 py-1 rounded-sm hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {displayPrice != null && (
                                <div className="mt-3 flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-blue-600">
                                        {formatIdr(displayPrice)}
                                    </span>
                                    {comparePrice && comparePrice > displayPrice && (
                                        <span className="text-base text-slate-400 line-through">
                                            {formatIdr(comparePrice)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {product.description && (
                            <div
                                className="text-slate-500 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
                            />
                        )}

                        <div className="border-t border-slate-100 pt-6">
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="mb-3 font-semibold text-slate-900">{t('product.variants')}</h2>
                                    <VariantSelector
                                        variants={product.variants}
                                        selectedId={selectedVariantId}
                                        onChange={handleVariantChange}
                                        onOptionSelect={handleOptionSelect}
                                        onSelectionChange={setSelectedOptions}
                                    />
                                </div>
                            )}

                            {hasShipping && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-slate-700 mb-2">
                                        {t('product.price')}
                                    </p>

                                    <div className="border border-slate-100 rounded-sm overflow-hidden text-sm">
                                        {/* Header */}
                                        <div className={`grid ${shippingGridCols} bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide`}>
                                            <span>{t('product.location')}</span>
                                            {showDeliveryColumn && <span className="text-right">{t('product.delivery')}</span>}
                                            <span className="text-right">{t('product.total')}</span>
                                        </div>

                                        {/* Batam */}
                                        {activeBatamCharge > 0 && (
                                            <div className={`grid ${shippingGridCols} px-3 py-2 border-t border-slate-100`}>
                                                <span className="text-slate-700 font-medium">{t('product.batam_and_delivery')}</span>
                                                {showDeliveryColumn && (
                                                    <span className="text-right text-slate-500">
                                                        {formatIdr(activeBatamCharge)}
                                                    </span>
                                                )}
                                                <span className="text-right font-semibold text-slate-900">
                                                    {displayPrice
                                                        ? formatIdr(displayPrice + activeBatamCharge)
                                                        : '-'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Jakarta */}
                                        {activeJakartaCharge > 0 && (
                                            <div className={`grid ${shippingGridCols} px-3 py-2 border-t border-slate-100`}>
                                                <span className="text-slate-700 font-medium">{t('product.jakarta_and_delivery')}</span>
                                                {showDeliveryColumn && (
                                                    <span className="text-right text-slate-500">
                                                        {formatIdr(activeJakartaCharge)}
                                                    </span>
                                                )}
                                                <span className="text-right font-semibold text-slate-900">
                                                    {displayPrice
                                                        ? formatIdr(displayPrice + activeJakartaCharge)
                                                        : '-'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Others - ALWAYS shown if whatsapp exists */}
                                        {whatsapp_number && (
                                            <div className={`grid ${shippingGridCols} px-3 py-2 border-t border-slate-100 items-center`}>
                                                <span className="text-slate-700 font-medium">{t('product.others')}</span>

                                                <span className={`${showDeliveryColumn ? 'col-span-2' : ''} flex justify-end`}>
                                                    <a
                                                        href={`https://wa.me/${whatsapp_number.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            className="h-3.5 w-3.5 fill-current"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                        </svg>
                                                        {t('product.contact_wa')}
                                                    </a>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!noDeliveryAvailable && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                                            className="w-10 h-12 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                        >
                                            <Minus className="h-3.5 w-3.5 text-slate-600" />
                                        </button>

                                        <span className="w-10 text-center text-sm font-medium">{qty}</span>

                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => q + 1)}
                                            className="w-10 h-12 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5 text-slate-600" />
                                        </button>
                                    </div>

                                    <button
                                        disabled={product.variants && product.variants.length > 0 && !selectedVariant}
                                        onClick={() => {
                                            if (product.variants && product.variants.length > 0) {
                                                if (selectedVariantId) {
                                                    addItem(selectedVariantId, qty);
                                                    toast.success(t('cart.added'));
                                                }
                                            } else {
                                                addProduct(product.id, qty);
                                                toast.success(t('cart.added'));
                                            }
                                        }}
                                        className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 text-white py-3 font-semibold text-sm uppercase tracking-widest transition-colors rounded-sm"
                                    >
                                        {t('product.add_to_cart')}
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* ── Lightbox ── */}
            {lightboxOpen && images.length > 0 && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    {/* Close */}
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <X className="h-8 w-8" />
                    </button>

                    {/* Prev */}
                    {activeImageIndex > 0 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors bg-black/30 p-2 rounded-full"
                            onClick={prevImage}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                    )}

                    {/* Image */}
                    <img
                        src={images[activeImageIndex].url}
                        alt={product.name}
                        className="max-h-[90vh] max-w-[90vw] object-contain select-none"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Next */}
                    {activeImageIndex < images.length - 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors bg-black/30 p-2 rounded-full"
                            onClick={nextImage}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    )}

                    {/* Counter + thumbnails */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                        {images.length > 1 && (
                            <div className="flex gap-2">
                                {images.map((img, i) => (
                                    <button
                                        key={img.id}
                                        onClick={(e) => { e.stopPropagation(); handleImageChange(i); }}
                                        className={`w-10 h-10 rounded overflow-hidden border-2 transition-colors ${
                                            i === activeImageIndex ? 'border-white' : 'border-white/30'
                                        }`}
                                    >
                                        <img src={img.thumb || img.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                        <span className="text-white/50 text-xs">
                            {activeImageIndex + 1} / {images.length}
                        </span>
                    </div>
                </div>
            )}
        </CustomerLayout>
    );
}
