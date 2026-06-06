import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { ChevronRight, SlidersHorizontal, Search, X } from 'lucide-react';
import { useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import CustomerLayout from '@/layouts/customer-layout';
import type { Category, Product } from '@/types/product';

interface ShopProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    categories: Category[];
    currentCategory?: string;
    activeFilters: { search?: string };
    whatsapp_number?: string;
}

export default function Shop({ products, categories, currentCategory, activeFilters, whatsapp_number }: ShopProps) {
    const [filterOpen, setFilterOpen] = useState(false);
    const [draftSearch, setDraftSearch] = useState(activeFilters.search ?? '');
    const [draftCategory, setDraftCategory] = useState(currentCategory ?? '');

    const activeCategory = categories.find((c) => c.slug === currentCategory);

    const totalActiveFilters = (activeFilters.search ? 1 : 0) + (currentCategory ? 1 : 0);

    function applyFilters() {
        const params: Record<string, string> = {};
        if (draftCategory) params.category = draftCategory;
        if (draftSearch.trim()) params.search = draftSearch.trim();
        router.get('/shop', params, { preserveState: false });
        setFilterOpen(false);
    }

    function removeFilter(type: 'search' | 'category') {
        const params: Record<string, string> = {};
        if (type !== 'category' && currentCategory) params.category = currentCategory;
        if (type !== 'search' && activeFilters.search) params.search = activeFilters.search;
        router.get('/shop', params, { preserveState: false });
    }

    return (
        <CustomerLayout fullWidth>
            <Head title="Shop" />

            {/* Page Header Banner */}
            <div className="py-14 text-center">
                <h1 className="text-4xl font-bold text-slate-900">Shop</h1>
                <p className="text-sm text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-blue-600">{activeCategory ? activeCategory.name : 'All Products'}</span>
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#EFE9DF] border-y border-[#DDD6CB]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                            <SheetTrigger asChild>
                                <button className="flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filter
                                    {totalActiveFilters > 0 && (
                                        <span className="ml-1 rounded-full bg-blue-600 text-white text-[10px] px-1.5 py-0.5 font-bold leading-none">
                                            {totalActiveFilters}
                                        </span>
                                    )}
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 p-0 flex flex-col">
                                <SheetHeader className="px-6 py-5 border-b">
                                    <SheetTitle>Filters</SheetTitle>
                                </SheetHeader>

                                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                                    {/* Category */}
                                    {categories.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Category</p>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        checked={draftCategory === ''}
                                                        onChange={() => setDraftCategory('')}
                                                        className="accent-slate-900"
                                                    />
                                                    <span className="text-sm text-slate-700">All Products</span>
                                                </label>
                                                {categories.map((cat) => (
                                                    <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="category"
                                                            checked={draftCategory === cat.slug}
                                                            onChange={() => setDraftCategory(cat.slug)}
                                                            className="accent-slate-900"
                                                        />
                                                        <span className="text-sm text-slate-700">{cat.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Search */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Search</p>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                value={draftSearch}
                                                onChange={(e) => setDraftSearch(e.target.value)}
                                                placeholder="Search products..."
                                                className="pl-9"
                                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                            />
                                        </div>
                                    </div>

                                </div>

                                {/* Footer actions */}
                                <div className="px-6 py-4 border-t flex gap-3">
                                    <button
                                        onClick={() => {
                                            setDraftSearch('');
                                            setDraftCategory('');
                                        }}
                                        className="flex-1 border border-slate-300 text-slate-700 text-sm py-2.5 rounded hover:bg-slate-50 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={applyFilters}
                                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-sm py-2.5 rounded transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="h-5 w-px bg-slate-200 hidden md:block" />
                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                            Showing{' '}
                            <span className="font-semibold text-slate-900">{products.data.length}</span>{' '}
                            results
                            {activeCategory && (
                                <span> in <span className="font-semibold text-blue-600">{activeCategory.name}</span></span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Filter Tags */}
            {(activeFilters.search || currentCategory) && (
                <div className="border-b border-slate-100">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-2">
                        {currentCategory && activeCategory && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full">
                                Category: {activeCategory.name}
                                <button onClick={() => removeFilter('category')} className="hover:text-slate-900 ml-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {activeFilters.search && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full">
                                Search: "{activeFilters.search}"
                                <button onClick={() => removeFilter('search')} className="hover:text-blue-900 ml-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                {products.data.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-2xl font-semibold text-slate-300 mb-3">No products found</p>
                        <p className="text-slate-400 text-sm mb-6">Try adjusting your filters or check back later.</p>
                        <Link href="/shop" className="text-blue-600 underline text-sm">View all products</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.data.map((product) => (
                            <ProductCard key={product.id} product={product} whatsappNumber={whatsapp_number} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                        {products.prev_page_url && (
                            <Link
                                href={products.prev_page_url}
                                className="px-5 py-2.5 border border-slate-900 text-slate-900 text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors rounded-sm"
                            >
                                Prev
                            </Link>
                        )}
                        <span className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-sm">
                            {products.current_page}
                        </span>
                        {products.next_page_url && (
                            <Link
                                href={products.next_page_url}
                                className="px-5 py-2.5 border border-slate-900 text-slate-900 text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors rounded-sm"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
