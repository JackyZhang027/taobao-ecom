import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import CustomerLayout from '@/layouts/customer-layout';
import type { Category } from '@/types/product';

interface CategoriesProps {
    categories: Category[];
    search: string;
}

export default function Categories({ categories, search }: CategoriesProps) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(search);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setDraft(search);
    }, [search]);

    const applySearch = (value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get('/categories', value.trim() ? { search: value.trim() } : {}, {
                preserveState: true,
                replace: true,
            });
        }, 400);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraft(e.target.value);
        applySearch(e.target.value);
    };

    const clearSearch = () => {
        setDraft('');
        router.get('/categories', {}, { preserveState: true, replace: true });
    };

    return (
        <CustomerLayout fullWidth>
            <Head title={t('categories.title')} />

            {/* Page Header */}
            <div className="bg-[#F8FAFC] py-14 text-center">
                <h1 className="text-4xl font-bold text-slate-900">{t('categories.title')}</h1>
                <p className="text-sm text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <Link href="/" className="font-medium text-slate-900 hover:text-blue-600">
                        Home
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-blue-600">{t('categories.title')}</span>
                </p>
            </div>

            {/* Search Bar */}
            <div className="bg-[#F1F5F9] border-y border-slate-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                            value={draft}
                            onChange={handleChange}
                            placeholder={t('categories.search_placeholder')}
                            className="pl-9 pr-9 bg-white"
                        />
                        {draft && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                {categories.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-2xl font-semibold text-slate-300 mb-3">{t('categories.no_results')}</p>
                        <p className="text-slate-400 text-sm mb-6">{search}</p>
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="text-blue-600 underline text-sm"
                        >
                            {t('categories.clear_search')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/shop?category=${category.slug}`}
                                className="group cursor-pointer text-center"
                            >
                                <div className="w-full aspect-[4/5] mb-3 overflow-hidden rounded-sm bg-[#F1F5F9] relative">
                                    {category.image_url ? (
                                        <img
                                            src={category.image_url}
                                            alt={category.name}
                                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex bg-slate-200 items-center justify-center w-full h-full text-4xl font-bold text-slate-300">
                                            {category.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {category.name}
                                </h3>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
