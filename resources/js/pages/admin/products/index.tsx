import { Head, router } from '@inertiajs/react';
import { LayoutGrid, Plus, Table as TableIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import type { AdminDataTableRef } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AdminLayout from '@/layouts/admin-layout';
import { escHtml } from '@/lib/utils';
import { ProductGrid } from './product-grid';
import type { ProductGridRef } from './product-grid';

const STATUS_OPTIONS = ['all', 'active', 'inactive'];
const VIEW_STORAGE_KEY = 'admin.products.view';

const columns = [
    {
        data: 'image',
        title: 'Image',
        orderable: false,
        searchable: false,
        render: (data: string) => data,
    },
    {
        data: 'name',
        title: 'Name',
        render: (
            data: string,
            _type: unknown,
            row: { variants_count: number },
        ) =>
            `<div>${escHtml(data)}</div>` +
            (row.variants_count > 0
                ? `<div class="text-xs text-muted-foreground">${row.variants_count} variant${row.variants_count === 1 ? '' : 's'}</div>`
                : ''),
    },
    { data: 'slug', title: 'Slug', className: 'text-muted-foreground' },
    { data: 'price_display', title: 'Price (RMB)' },
    { data: 'delivery_charge_idr', title: 'Delivery (IDR)' },
    {
        data: 'final_price_idr',
        title: 'Final Price (IDR)',
        className: 'font-bold',
    },
    {
        data: 'status',
        title: 'Status',
        render: (data: string) =>
            data === 'Active'
                ? '<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-transparent">Active</span>'
                : '<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border-transparent">Inactive</span>',
    },
    {
        data: 'actions',
        title: 'Actions',
        orderable: false,
        searchable: false,
        className: 'text-right',
        render: (data: { id: number; slug: string }) =>
            `<div class="flex justify-end gap-2">
                <a href="/products/${escHtml(data.slug)}" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:underline text-sm">Preview</a>
                <a href="/admin/products/${data.id}/edit" class="text-primary hover:underline text-sm">Edit</a>
                <button onclick="if(confirm('Delete this product?')) window._inertiaDelete('/admin/products/${data.id}')" class="text-destructive hover:underline text-sm">Delete</button>
            </div>`,
    },
];

interface CategoryOption {
    id: number;
    name: string;
}

export default function AdminProductsIndex({
    categories = [],
}: {
    categories?: CategoryOption[];
}) {
    const tableRef = useRef<AdminDataTableRef>(null);
    const gridRef = useRef<ProductGridRef>(null);

    const [view, setView] = useState<'table' | 'grid'>(() =>
        typeof window !== 'undefined' &&
        localStorage.getItem(VIEW_STORAGE_KEY) === 'grid'
            ? 'grid'
            : 'table',
    );
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('all');
    const [status, setStatus] = useState('all');

    useEffect(() => {
        const timeout = setTimeout(() => setSearch(searchInput), 400);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        (window as any)._inertiaDelete = (url: string) =>
            router.delete(url, {
                onSuccess: () => {
                    toast.success('Product deleted successfully');
                    tableRef.current?.reload();
                    gridRef.current?.reload();
                },
                onError: () => toast.error('Failed to delete product'),
            });
    }, []);

    const filters = useMemo(
        () => ({
            search,
            category_id: categoryId,
            status,
        }),
        [search, categoryId, status],
    );

    const hasActiveFilters =
        search !== '' || categoryId !== 'all' || status !== 'all';

    const clearFilters = () => {
        setSearchInput('');
        setSearch('');
        setCategoryId('all');
        setStatus('all');
    };

    const changeView = (value: string) => {
        if (value !== 'table' && value !== 'grid') return;
        setView(value);
        localStorage.setItem(VIEW_STORAGE_KEY, value);
    };

    return (
        <AdminLayout>
            <Head title="Products" />
            <AdminPageHeader
                title="Products"
                actions={
                    <Button asChild>
                        <a href="/admin/products/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Product
                        </a>
                    </Button>
                }
            />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Products</CardTitle>
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={view}
                        onValueChange={changeView}
                    >
                        <ToggleGroupItem value="table" aria-label="Table view">
                            <TableIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="grid" aria-label="Grid view">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Search
                            </span>
                            <Input
                                type="text"
                                placeholder="Name or slug..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-56"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Category
                            </span>
                            <Select
                                value={categoryId}
                                onValueChange={setCategoryId}
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All categories
                                    </SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Status
                            </span>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option}
                                            value={option}
                                            className="capitalize"
                                        >
                                            {option === 'all'
                                                ? 'All statuses'
                                                : option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearFilters}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                    {view === 'table' ? (
                        <AdminDataTable
                            ref={tableRef}
                            url="/admin/products/datatable"
                            columns={columns}
                            filters={filters}
                            options={{ searching: false }}
                        />
                    ) : (
                        <ProductGrid ref={gridRef} filters={filters} />
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
