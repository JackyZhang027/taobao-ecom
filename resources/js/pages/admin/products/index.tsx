import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable  } from '@/components/admin/data-table';
import type {AdminDataTableRef} from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { escHtml } from '@/lib/utils';

const columns = [
    {
        data: 'image',
        title: 'Image',
        orderable: false,
        searchable: false,
        render: (data: string) => data,
    },
    { data: 'name', title: 'Name' },
    { data: 'slug', title: 'Slug', className: 'text-muted-foreground' },
    { data: 'price_display', title: 'Price (RMB)', render: (data: string) => data },
    { data: 'delivery_charge_idr', title: 'Delivery (IDR)', render: (data: string) => data },
    { data: 'final_price_idr', title: 'Final Price (IDR)', className: 'font-bold', render: (data: string) => data },
    {
        data: 'status',
        title: 'Status',
        render: (data: string) =>
            data === 'Active'
                ? '<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-transparent">Active</span>'
                : '<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border-transparent">Inactive</span>',
    },
    { data: 'variants_count', title: 'Variants' },
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

export default function AdminProductsIndex() {
    const tableRef = useRef<AdminDataTableRef>(null);

    useEffect(() => {
        (window as any)._inertiaDelete = (url: string) => router.delete(url, {
            onSuccess: () => {
                toast.success('Product deleted successfully');
                tableRef.current?.reload();
            },
            onError: () => toast.error('Failed to delete product'),
        });
    }, []);

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
                <CardHeader>
                    <CardTitle>All Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable ref={tableRef} url="/admin/products/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
