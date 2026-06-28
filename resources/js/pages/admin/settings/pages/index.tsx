import { Head, router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { sequenceColumn } from '@/lib/datatable-sequence-column';
import { escHtml } from '@/lib/utils';

export default function AdminPagesIndex() {
    useEffect(() => {
        (window as any)._deletePage = (url: string) => router.delete(url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Page deleted successfully'),
            onError: () => toast.error('Failed to delete page'),
        });
    }, []);

    const columns = [
        sequenceColumn(),
        { data: 'title', title: 'Title', orderable: false },
        { data: 'slug', title: 'Slug', orderable: true },
        { data: 'footer_section', title: 'Footer Section', orderable: false },
        { data: 'status', title: 'Status', orderable: true },
        {
            data: 'actions',
            title: 'Actions',
            orderable: false,
            searchable: false,
            render: (data: string) => `
                <div class="flex items-center gap-2">
                    <a href="/admin/settings/pages/${escHtml(data)}/edit" class="text-sm text-blue-600 hover:text-blue-800">Edit</a>
                    <button onclick="_deletePage('/admin/settings/pages/${escHtml(data)}')" class="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
            `,
        },
    ];

    return (
        <AdminLayout breadcrumbs={[{ title: 'Settings', href: '/admin/settings/shop' }, { title: 'Pages', href: '' }]}>
            <Head title="Pages" />

            <AdminPageHeader
                title="Pages"
                subtitle="Manage static content pages like Shipping Policy, shown in the storefront footer."
                actions={
                    <Button asChild>
                        <Link href="/admin/settings/pages/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Page
                        </Link>
                    </Button>
                }
            />

            <AdminDataTable
                url="/admin/settings/pages/datatable"
                columns={columns}
            />
        </AdminLayout>
    );
}
