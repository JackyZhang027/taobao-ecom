import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const columns = [
    { data: 'name', title: 'Name' },
    { data: 'slug', title: 'Slug', className: 'text-muted-foreground' },
    { data: 'price_display', title: 'Price (RMB)' },
    { data: 'delivery_charge_idr', title: 'Delivery (IDR)' },
    { data: 'final_price_idr', title: 'Final Price (IDR)', className: 'font-bold' },
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
        render: (id: number) =>
            `<div class="flex justify-end gap-2">
                <a href="/admin/products/${id}/edit" class="text-primary hover:underline text-sm">Edit</a>
                <button onclick="if(confirm('Delete this product?')) window._inertiaDelete('/admin/products/${id}')" class="text-destructive hover:underline text-sm">Delete</button>
            </div>`,
    },
];

export default function AdminProductsIndex() {
    // Expose inertia delete for DataTable action buttons
    if (typeof window !== 'undefined') {
        (window as any)._inertiaDelete = (url: string) => router.delete(url, {
            onSuccess: () => toast.success('Product deleted successfully'),
            onError: () => toast.error('Failed to delete product'),
        });
    }

    return (
        <AdminLayout>
            <Head title="Products" />
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Products</h1>
                <Button asChild>
                    <a href="/admin/products/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Product
                    </a>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/products/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
