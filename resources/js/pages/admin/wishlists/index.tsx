import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

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
    useEffect(() => {
        (window as any)._inertiaDeleteWishlist = (url: string) =>
            router.delete(url, {
                preserveScroll: true,
                onSuccess: () => toast.success('Wishlist entry removed'),
                onError: () => toast.error('Failed to remove entry'),
            });
    }, []);

    return (
        <AdminLayout>
            <Head title="Wishlists" />
            <AdminPageHeader title="Wishlists" />
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
