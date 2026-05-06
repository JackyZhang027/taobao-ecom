import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Heart, Eye, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import type { Product } from '@/types/product';

interface ProductCardProps {
    product: Product;
    whatsappNumber?: string;
}

export function ProductCard({ product, whatsappNumber }: ProductCardProps) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();
    const { props } = usePage<{ auth?: { user?: { id: number } } }>();
    const isAuthenticated = !!props.auth?.user;
    const [wishlisted, setWishlisted] = useState(product.is_wishlisted ?? false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [hovered, setHovered] = useState(false);

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }
        setWishlistLoading(true);
        router.post(
            `/wishlist/${product.id}`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setWishlisted((prev) => !prev),
                onFinish: () => setWishlistLoading(false),
            },
        );
    };

    const waMessage = encodeURIComponent(`Halo, saya ingin memesan: ${product.name}`);
    const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${waMessage}` : null;

    const hasBatam = product.total_batam_idr != null && product.total_batam_idr > 0;
    const hasJakarta = product.total_jakarta_idr != null && product.total_jakarta_idr > 0;
    const hasDualPrices = hasBatam || hasJakarta;

    return (
        <div className="relative bg-[#F1F5F9] overflow-hidden rounded-sm">
            {/* Image */}
            <div
                className="relative overflow-hidden"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <Link href={`/products/${product.slug}`} className="block">
                    {product.thumbnail ? (
                        <img
                            src={product.thumbnail}
                            alt={product.name}
                            className={`w-full aspect-square object-cover transition-transform duration-500 ${hovered ? 'scale-105' : ''}`}
                        />
                    ) : (
                        <div className="w-full aspect-square bg-slate-200 flex items-center justify-center">
                            <span className="text-slate-400 text-sm">No image</span>
                        </div>
                    )}
                </Link>

                {/* Hover overlay */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Link
                        href={`/products/${product.slug}`}
                        className="cursor-pointer bg-white text-blue-600 font-semibold text-sm px-6 py-2.5 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                        {t('product.view_detail')}
                    </Link>
                    <div className="flex gap-3">
                        <button
                            className={`cursor-pointer w-9 h-9 bg-white flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors rounded-sm ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleWishlist}
                            disabled={wishlistLoading}
                            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            <Heart
                                className={`h-4 w-4 transition-colors ${wishlisted ? 'fill-red-500 text-red-500' : ''}`}
                            />
                        </button>
                        <Link
                            href={`/products/${product.slug}`}
                            className="cursor-pointer w-9 h-9 bg-white flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors rounded-sm"
                            title="View product"
                        >
                            <Eye className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 bg-white">
                <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-slate-900 text-base line-clamp-1 hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>
                {product.description && (
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                        {product.description.replace(/<[^>]*>/g, '')}
                    </p>
                )}

                <div className="mt-2">
                    {hasDualPrices ? (
                        <div className="flex flex-col gap-0.5">
                            {hasBatam && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Batam</span>
                                    <span className="font-bold text-slate-900">{formatIdr(product.total_batam_idr!)}</span>
                                </div>
                            )}
                            {hasJakarta && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Jakarta</span>
                                    <span className="font-bold text-slate-900">{formatIdr(product.total_jakarta_idr!)}</span>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {hasDualPrices ? (
                    waLink && (
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-white bg-green-500 hover:bg-green-600 transition-colors rounded-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Pesan ke Lokasi Lain
                        </a>
                    )
                ) : (
                    waLink && (
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-white bg-green-500 hover:bg-green-600 transition-colors rounded-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Contact WA
                        </a>
                    )
                )}
            </div>
        </div>
    );
}
