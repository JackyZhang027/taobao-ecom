import { Head, router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';

export default function AdminHeroSettingsIndex() {
    useEffect(() => {
        (window as any)._inertiaDelete = (url: string) => router.delete(url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Hero slide deleted successfully'),
            onError: () => toast.error('Failed to delete hero slide'),
        });
    }, []);

    const columns = [
        { data: 'id', title: 'ID', orderable: true },
        { 
            data: 'image_url', 
            title: 'Image', 
            orderable: false,
            render: (data: string) => data ? `<img src="${data}" alt="Hero" class="w-16 h-10 object-cover rounded-md" />` : 'No Image'
        },
        { data: 'title', title: 'Title', orderable: true },
        { data: 'sort_order', title: 'Order', orderable: true },
        { data: 'status', title: 'Status', orderable: true },
        {
            data: 'actions',
            title: 'Actions',
            orderable: false,
            searchable: false,
            render: (data: string) => `
                <div class="flex items-center gap-2">
                    <a href="/admin/settings/hero/${data}/edit" class="text-sm text-blue-600 hover:text-blue-800">Edit</a>
                    <button onclick="_inertiaDelete('/admin/settings/hero/${data}')" class="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
            `,
        },
    ];

    return (
        <AdminLayout breadcrumbs={[{ title: 'Settings', href: '/admin/settings/shop' }, { title: 'Hero Slides', href: '' }]}>
            <Head title="Hero Slides Settings" />

            <AdminPageHeader
                title="Hero Slides"
                subtitle="Manage the homepage hero banners."
                actions={
                    <Button asChild>
                        <Link href="/admin/settings/hero/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Hero Slide
                        </Link>
                    </Button>
                }
            />

            <AdminDataTable
                url="/admin/settings/hero/datatable"
                columns={columns}
            />
        </AdminLayout>
    );
}
