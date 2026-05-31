import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Link } from '@inertiajs/react';
import { Plus, Share2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';

export default function AdminSocialLinksIndex() {
    if (typeof window !== 'undefined') {
        (window as any)._deleteSocialLink = (url: string) => router.delete(url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Social link deleted successfully'),
            onError: () => toast.error('Failed to delete social link'),
        });
    }

    const columns = [
        { data: 'id', title: 'ID', orderable: true },
        { data: 'name', title: 'Name', orderable: true },
        { data: 'icon', title: 'Icon', orderable: true },
        {
            data: 'url',
            title: 'URL',
            orderable: false,
            render: (data: string) => `<a href="${data}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline max-w-xs block truncate">${data}</a>`,
        },
        { data: 'sort_order', title: 'Order', orderable: true },
        { data: 'status', title: 'Status', orderable: true },
        {
            data: 'actions',
            title: 'Actions',
            orderable: false,
            searchable: false,
            render: (data: string) => `
                <div class="flex items-center gap-2">
                    <a href="/admin/settings/social-links/${data}/edit" class="text-sm text-blue-600 hover:text-blue-800">Edit</a>
                    <button onclick="_deleteSocialLink('/admin/settings/social-links/${data}')" class="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
            `,
        },
    ];

    return (
        <AdminLayout breadcrumbs={[{ title: 'Settings', href: '/admin/settings/shop' }, { title: 'Social Links', href: '' }]}>
            <Head title="Social Links" />

            <AdminPageHeader
                title="Social Links"
                subtitle="Manage the social media links shown in the storefront footer."
                actions={
                    <Button asChild>
                        <Link href="/admin/settings/social-links/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Social Link
                        </Link>
                    </Button>
                }
            />

            <AdminDataTable
                url="/admin/settings/social-links/datatable"
                columns={columns}
            />
        </AdminLayout>
    );
}
