import { Link } from '@inertiajs/react';
import { Heart, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import type { Product } from '@/types/product';

export function ProductCard({ product }: { product: Product }) {
    const { t } = useTranslation();
    const { formatIdr } = useCurrency();

    return (
        <div className="group relative bg-[#F1F5F9] overflow-hidden rounded-sm">
            {/* Image */}
            <Link href={`/products/${product.slug}`} className="block relative overflow-hidden">
                {product.thumbnail ? (
                    <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full aspect-square bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">No image</span>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                    <Link
                        href={`/products/${product.slug}`}
                        className="bg-white text-blue-600 font-semibold text-sm px-6 py-2.5 hover:bg-slate-900 hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {t('product.view_detail') || 'View Detail'}
                    </Link>
                    <div className="flex gap-3">
                        <button className="w-9 h-9 bg-white flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors rounded-sm">
                            <Heart className="h-4 w-4" />
                        </button>
                        <button className="w-9 h-9 bg-white flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors rounded-sm">
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4 bg-white">
                <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-slate-900 text-base line-clamp-1 hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>
                {product.description && (
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{product.description.replace(/<[^>]*>/g, '')}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                    {product.price_idr !== undefined ? (
                        <span className="font-bold text-slate-900">{formatIdr(product.price_idr)}</span>
                    ) : (
                        <span />
                    )}
                </div>
            </div>
        </div>
    );
}
