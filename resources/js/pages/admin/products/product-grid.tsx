import { Link, router } from '@inertiajs/react';
import { ImageOff, Layers, Trash2 } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface ProductGridRef {
    reload: () => void;
}

interface ProductGridProps {
    filters: Record<string, unknown>;
}

interface GridProduct {
    id: number;
    slug: string;
    name: string;
    image: string | null;
    price_display: string;
    final_price_idr: string;
    is_active: boolean;
    variants_count: number;
}

interface GridResponse {
    data: GridProduct[];
    current_page: number;
    last_page: number;
    total: number;
}

export const ProductGrid = forwardRef<ProductGridRef, ProductGridProps>(
    function ProductGrid({ filters }, ref) {
        const [page, setPage] = useState(1);
        const [refreshKey, setRefreshKey] = useState(0);
        const [result, setResult] = useState<{
            key: string;
            response: GridResponse;
        } | null>(null);

        const filtersKey = JSON.stringify(filters);

        // Reset to page 1 when filters change (state adjustment during render).
        const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
        if (prevFiltersKey !== filtersKey) {
            setPrevFiltersKey(filtersKey);
            setPage(1);
        }

        const fetchKey = `${page}|${refreshKey}|${filtersKey}`;

        useImperativeHandle(ref, () => ({
            reload: () => setRefreshKey((k) => k + 1),
        }));

        useEffect(() => {
            const controller = new AbortController();

            const params = new URLSearchParams();
            params.set('page', String(page));
            for (const [key, value] of Object.entries(
                JSON.parse(filtersKey) as Record<string, unknown>,
            )) {
                if (value !== undefined && value !== null && value !== '') {
                    params.set(key, String(value));
                }
            }

            fetch(`/admin/products/grid?${params.toString()}`, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json() as Promise<GridResponse>;
                })
                .then((json) => setResult({ key: fetchKey, response: json }))
                .catch((err: unknown) => {
                    if (
                        err instanceof DOMException &&
                        err.name === 'AbortError'
                    )
                        return;
                    toast.error('Failed to load products');
                    setResult({
                        key: fetchKey,
                        response: {
                            data: [],
                            current_page: page,
                            last_page: 1,
                            total: 0,
                        },
                    });
                });

            return () => controller.abort();
        }, [fetchKey, page, filtersKey]);

        const loading = result?.key !== fetchKey;
        const items = result?.response.data ?? [];
        const lastPage = result?.response.last_page ?? 1;
        const total = result?.response.total ?? 0;

        const handleDelete = (product: GridProduct) => {
            if (!confirm('Delete this product?')) return;
            router.delete(`/admin/products/${product.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Product deleted successfully');
                    setRefreshKey((k) => k + 1);
                },
                onError: () => toast.error('Failed to delete product'),
            });
        };

        if (loading) {
            return (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-lg border"
                        >
                            <Skeleton className="aspect-square w-full rounded-none" />
                            <div className="space-y-2 p-3">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (items.length === 0) {
            return (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    No products found.
                </div>
            );
        }

        return (
            <div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {items.map((product) => (
                        <div
                            key={product.id}
                            className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:border-primary/50 hover:shadow-md"
                        >
                            <div
                                className={cn(
                                    'flex aspect-square items-center justify-center bg-muted',
                                    !product.is_active &&
                                        'opacity-60 grayscale',
                                )}
                            >
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageOff className="h-8 w-8 text-muted-foreground/50" />
                                )}
                            </div>
                            <div className="pointer-events-none absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
                                {!product.is_active && (
                                    <span className="inline-flex items-center rounded-full bg-red-100/95 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                        Inactive
                                    </span>
                                )}
                                {product.variants_count > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                                        <Layers className="h-3 w-3" />
                                        {product.variants_count}{' '}
                                        {product.variants_count === 1
                                            ? 'variant'
                                            : 'variants'}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1 p-3">
                                <p
                                    className={cn(
                                        'line-clamp-2 text-sm font-medium',
                                        !product.is_active &&
                                            'text-muted-foreground',
                                    )}
                                >
                                    {product.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {product.price_display}
                                </p>
                                <p className="text-sm font-semibold">
                                    {product.final_price_idr}
                                </p>
                            </div>
                            <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="absolute inset-0"
                                aria-label={product.name}
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 z-10 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                aria-label={`Delete ${product.name}`}
                                onClick={() => handleDelete(product)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {lastPage} · {total}{' '}
                        {total === 1 ? 'product' : 'products'}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={page >= lastPage}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        );
    },
);
