import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminDataTable } from '@/components/admin/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const columns = [
    { data: 'id', title: '#', width: '60px' },
    { data: 'user_name', title: 'Customer' },
    { data: 'product_name', title: 'Product' },
    {
        data: 'created_at',
        title: 'Date Added',
        render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
        data: 'actions',
        title: '',
        orderable: false,
        searchable: false,
        render: (id: number) =>
            `<button onclick="if(confirm('Remove this wishlist entry?')) window._inertiaDeleteWishlist('/admin/wishlists/${id}')" class="text-destructive hover:underline text-sm">Delete</button>`,
    },
];

export default function AdminWishlistsIndex() {
    if (typeof window !== 'undefined') {
        (window as any)._inertiaDeleteWishlist = (url: string) =>
            router.delete(url, {
                preserveScroll: true,
                onSuccess: () => toast.success('Wishlist entry removed'),
                onError: () => toast.error('Failed to remove entry'),
            });
    }

    return (
        <AdminLayout>
            <Head title="Wishlists" />
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Wishlists</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Wishlists</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/wishlists/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
