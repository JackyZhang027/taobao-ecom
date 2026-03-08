import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Minus, Plus, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { VariantSelector } from '@/components/variant-selector';
import { useCart } from '@/hooks/use-cart';
import { useCurrency } from '@/hooks/use-currency';
import CustomerLayout from '@/layouts/customer-layout';
import type { Product, ProductMedia } from '@/types/product';

interface ShowProps {
    product: Product;
}

export default function ProductShow({ product }: ShowProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();
    const { addItem, addProduct } = useCart();

    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        product.variants?.[0]?.id ?? null,
    );
    const [qty, setQty] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
    const hasVariants = product.variants && product.variants.length > 0;
    const displayPrice = hasVariants ? selectedVariant?.price_idr : product.price_idr;

    // Build displayable images list: prefer media collection, fall back to thumbnail
    const images: ProductMedia[] =
        product.media && product.media.length > 0
            ? product.media
            : product.thumbnail
              ? [{ id: 0, url: product.thumbnail, thumb: product.thumbnail }]
              : [];

    const activeImage = images[activeImageIndex];

    function prevImage(e?: React.MouseEvent) {
        e?.stopPropagation();
        setActiveImageIndex((i) => Math.max(0, i - 1));
    }

    function nextImage(e?: React.MouseEvent) {
        e?.stopPropagation();
        setActiveImageIndex((i) => Math.min(images.length - 1, i + 1));
    }

    return (
        <CustomerLayout fullWidth>
            <Head title={product.name} />

            {/* Breadcrumb banner */}
            <div className="bg-[#F8FAFC] py-10 text-center">
                <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
                <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1">
                    <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/shop" className="font-medium text-slate-900 hover:text-blue-600">Shop</Link>
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
                                    <span className="text-slate-400 text-sm">No image</span>
                                </div>
                            )}
                            {images.length > 0 && (
                                <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="h-3.5 w-3.5" />
                                    Zoom
                                </div>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {images.map((img, i) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setActiveImageIndex(i)}
                                        className={`shrink-0 w-16 h-16 rounded-sm overflow-hidden border-2 transition-colors ${
                                            i === activeImageIndex
                                                ? 'border-blue-600'
                                                : 'border-transparent hover:border-slate-300'
                                        }`}
                                    >
                                        <img
                                            src={img.thumb || img.url}
                                            alt={`View ${i + 1}`}
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
                            {displayPrice !== undefined && displayPrice > 0 && (
                                <p className="text-2xl font-bold text-blue-600 mt-3">
                                    {formatIdr(displayPrice)}
                                </p>
                            )}
                        </div>

                        {product.description && (
                            <div
                                className="text-slate-500 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        )}

                        <div className="border-t border-slate-100 pt-6">
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="mb-3 font-semibold text-slate-900">{t('product.variants')}</h2>
                                    <VariantSelector
                                        variants={product.variants}
                                        selectedId={selectedVariantId}
                                        onChange={setSelectedVariantId}
                                    />
                                </div>
                            )}

                            {product.delivery_charge_idr !== undefined && product.delivery_charge_idr > 0 && (
                                <p className="text-sm text-slate-400 mb-6">
                                    {t('product.shipping')}: <span className="font-medium text-slate-700">{formatIdr(product.delivery_charge_idr)}</span>
                                </p>
                            )}

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
                                                toast.success(t('cart.added') || 'Added to cart');
                                            }
                                        } else {
                                            addProduct(product.id, qty);
                                            toast.success(t('cart.added') || 'Added to cart');
                                        }
                                    }}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 text-white py-3 font-semibold text-sm uppercase tracking-widest transition-colors rounded-sm"
                                >
                                    {t('product.add_to_cart')}
                                </button>
                            </div>
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
                                        onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i); }}
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
