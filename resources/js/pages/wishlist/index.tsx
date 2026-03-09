import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import CustomerLayout from '@/layouts/customer-layout';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/types/product';

interface WishlistProps {
    products: Product[];
}

export default function WishlistIndex({ products }: WishlistProps) {
    const { t } = useTranslation();

    return (
        <CustomerLayout>
            <Head title={t('wishlist.title')} />
            <h1 className="mb-6 text-2xl font-bold">{t('wishlist.title')}</h1>
            {products.length === 0 ? (
                <p className="text-muted-foreground">{t('wishlist.empty')}</p>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </CustomerLayout>
    );
}
