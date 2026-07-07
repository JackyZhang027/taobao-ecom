import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { ChevronRight, SlidersHorizontal, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import CustomerLayout from '@/layouts/customer-layout';
import type { Category, Product } from '@/types/product';

interface ShopProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
    };
    categories: Category[];
    currentCategory?: string;
    activeFilters: { search?: string };
    whatsapp_number?: string;
}

function pageWindow(current: number, last: number): (number | 'ellipsis')[] {
    const pages = new Set<number>([1, last]);
    for (let p = current - 1; p <= current + 1; p++) {
        if (p >= 1 && p <= last) pages.add(p);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const window: (number | 'ellipsis')[] = [];
    let prev = 0;
    for (const p of sorted) {
        if (prev && p - prev > 1) window.push('ellipsis');
        window.push(p);
        prev = p;
    }
    return window;
}

export default function Shop({
    products,
    categories,
    currentCategory,
    activeFilters,
    whatsapp_number,
}: ShopProps) {
    const { t } = useTranslation();
    const [filterOpen, setFilterOpen] = useState(false);
    const [draftSearch, setDraftSearch] = useState(activeFilters.search ?? '');
    const [draftCategory, setDraftCategory] = useState(currentCategory ?? '');

    const activeCategory = categories.find((c) => c.slug === currentCategory);

    const totalActiveFilters =
        (activeFilters.search ? 1 : 0) + (currentCategory ? 1 : 0);

    function applyFilters() {
        const params: Record<string, string> = {};
        if (draftCategory) params.category = draftCategory;
        if (draftSearch.trim()) params.search = draftSearch.trim();
        router.get('/shop', params, { preserveState: false });
        setFilterOpen(false);
    }

    function pageUrl(page: number) {
        const params = new URLSearchParams();
        if (currentCategory) params.set('category', currentCategory);
        if (activeFilters.search) params.set('search', activeFilters.search);
        if (page > 1) params.set('page', String(page));
        const qs = params.toString();
        return qs ? `/shop?${qs}` : '/shop';
    }

    function removeFilter(type: 'search' | 'category') {
        const params: Record<string, string> = {};
        if (type !== 'category' && currentCategory)
            params.category = currentCategory;
        if (type !== 'search' && activeFilters.search)
            params.search = activeFilters.search;
        router.get('/shop', params, { preserveState: false });
    }

    return (
        <CustomerLayout fullWidth>
            <Head title={t('nav.shop')} />

            {/* Page Header Banner */}
            <div className="py-14 text-center">
                <h1 className="text-4xl font-bold text-slate-900">
                    {t('nav.shop')}
                </h1>
                <p className="mt-3 flex items-center justify-center gap-1 text-sm text-slate-400">
                    <Link
                        href="/"
                        className="font-medium text-slate-900 hover:text-blue-600"
                    >
                        {t('nav.home')}
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-blue-600">
                        {activeCategory
                            ? activeCategory.name
                            : t('shop.all_products')}
                    </span>
                </p>
            </div>

            {/* Filter Bar */}
            <div className="border-y border-[#DDD6CB] bg-[#EFE9DF]">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-6">
                        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                            <SheetTrigger asChild>
                                <button className="flex items-center gap-2 text-sm font-medium text-slate-900 transition-colors hover:text-blue-600">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    {t('shop.filter')}
                                    {totalActiveFilters > 0 && (
                                        <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                                            {totalActiveFilters}
                                        </span>
                                    )}
                                </button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex w-80 flex-col p-0"
                            >
                                <SheetHeader className="border-b px-6 py-5">
                                    <SheetTitle>{t('shop.filters')}</SheetTitle>
                                </SheetHeader>

                                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                                    {/* Category */}
                                    {categories.length > 0 && (
                                        <div>
                                            <p className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                                {t('shop.category')}
                                            </p>
                                            <div className="space-y-2">
                                                <label className="flex cursor-pointer items-center gap-2.5">
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        checked={
                                                            draftCategory === ''
                                                        }
                                                        onChange={() =>
                                                            setDraftCategory('')
                                                        }
                                                        className="accent-slate-900"
                                                    />
                                                    <span className="text-sm text-slate-700">
                                                        {t('shop.all_products')}
                                                    </span>
                                                </label>
                                                {categories.map((cat) => (
                                                    <label
                                                        key={cat.id}
                                                        className="flex cursor-pointer items-center gap-2.5"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="category"
                                                            checked={
                                                                draftCategory ===
                                                                cat.slug
                                                            }
                                                            onChange={() =>
                                                                setDraftCategory(
                                                                    cat.slug,
                                                                )
                                                            }
                                                            className="accent-slate-900"
                                                        />
                                                        <span className="text-sm text-slate-700">
                                                            {cat.name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Search */}
                                    <div>
                                        <p className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            {t('common.search')}
                                        </p>
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={draftSearch}
                                                onChange={(e) =>
                                                    setDraftSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={t(
                                                    'shop.search_products_placeholder',
                                                )}
                                                className="pl-9"
                                                onKeyDown={(e) =>
                                                    e.key === 'Enter' &&
                                                    applyFilters()
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="flex gap-3 border-t px-6 py-4">
                                    <button
                                        onClick={() => {
                                            setDraftSearch('');
                                            setDraftCategory('');
                                        }}
                                        className="flex-1 rounded border border-slate-300 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        {t('shop.clear_all')}
                                    </button>
                                    <button
                                        onClick={applyFilters}
                                        className="flex-1 rounded bg-slate-900 py-2.5 text-sm text-white transition-colors hover:bg-slate-800"
                                    >
                                        {t('shop.apply')}
                                    </button>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="hidden h-5 w-px bg-slate-200 md:block" />
                        <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
                            {t('shop.showing')}{' '}
                            <span className="font-semibold text-slate-900">
                                {products.data.length}
                            </span>{' '}
                            {t('shop.results')}
                            {activeCategory && (
                                <span>
                                    {' '}
                                    {t('shop.in')}{' '}
                                    <span className="font-semibold text-blue-600">
                                        {activeCategory.name}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Filter Tags */}
            {(activeFilters.search || currentCategory) && (
                <div className="border-b border-slate-100">
                    <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-3 sm:px-6 lg:px-8">
                        {currentCategory && activeCategory && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                                {t('shop.category_label')} {activeCategory.name}
                                <button
                                    onClick={() => removeFilter('category')}
                                    className="ml-0.5 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {activeFilters.search && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                                {t('shop.search_label')} "{activeFilters.search}
                                "
                                <button
                                    onClick={() => removeFilter('search')}
                                    className="ml-0.5 hover:text-blue-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                {products.data.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="mb-3 text-2xl font-semibold text-slate-300">
                            {t('shop.no_products_found')}
                        </p>
                        <p className="mb-6 text-sm text-slate-400">
                            {t('shop.no_products_desc')}
                        </p>
                        <Link
                            href="/shop"
                            className="text-sm text-blue-600 underline"
                        >
                            {t('shop.view_all_products')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.data.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                whatsappNumber={whatsapp_number}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                        {products.current_page > 1 ? (
                            <Link
                                href={pageUrl(products.current_page - 1)}
                                preserveScroll
                                className="rounded-sm border border-slate-900 px-5 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                            >
                                {t('shop.prev')}
                            </Link>
                        ) : (
                            <span className="pointer-events-none rounded-sm border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-300">
                                {t('shop.prev')}
                            </span>
                        )}
                        {pageWindow(
                            products.current_page,
                            products.last_page,
                        ).map((item, index) =>
                            item === 'ellipsis' ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 text-sm text-slate-400"
                                >
                                    …
                                </span>
                            ) : item === products.current_page ? (
                                <span
                                    key={item}
                                    className="min-w-10 rounded-sm bg-slate-900 px-3 py-2.5 text-center text-sm font-medium text-white"
                                >
                                    {item}
                                </span>
                            ) : (
                                <Link
                                    key={item}
                                    href={pageUrl(item)}
                                    preserveScroll
                                    className="min-w-10 rounded-sm border border-slate-900 px-3 py-2.5 text-center text-sm font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                                >
                                    {item}
                                </Link>
                            ),
                        )}
                        {products.current_page < products.last_page ? (
                            <Link
                                href={pageUrl(products.current_page + 1)}
                                preserveScroll
                                className="rounded-sm border border-slate-900 px-5 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                            >
                                {t('shop.next')}
                            </Link>
                        ) : (
                            <span className="pointer-events-none rounded-sm border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-300">
                                {t('shop.next')}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
