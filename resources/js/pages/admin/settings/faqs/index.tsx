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

export default function AdminFaqsIndex() {
    useEffect(() => {
        (window as any)._deleteFaq = (url: string) => router.delete(url, {
            preserveScroll: true,
            onSuccess: () => toast.success('FAQ deleted successfully'),
            onError: () => toast.error('Failed to delete FAQ'),
        });
    }, []);

    const columns = [
        sequenceColumn(),
        { data: 'question', title: 'Question', orderable: false },
        { data: 'sort_order', title: 'Order', orderable: true },
        { data: 'status', title: 'Status', orderable: true },
        {
            data: 'actions',
            title: 'Actions',
            orderable: false,
            searchable: false,
            render: (data: string) => `
                <div class="flex items-center gap-2">
                    <a href="/admin/settings/faqs/${escHtml(data)}/edit" class="text-sm text-blue-600 hover:text-blue-800">Edit</a>
                    <button onclick="_deleteFaq('/admin/settings/faqs/${escHtml(data)}')" class="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
            `,
        },
    ];

    return (
        <AdminLayout breadcrumbs={[{ title: 'Settings', href: '/admin/settings/shop' }, { title: 'FAQs', href: '' }]}>
            <Head title="FAQs" />

            <AdminPageHeader
                title="FAQs"
                subtitle="Manage the frequently asked questions shown on the storefront FAQ page."
                actions={
                    <Button asChild>
                        <Link href="/admin/settings/faqs/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add FAQ
                        </Link>
                    </Button>
                }
            />

            <AdminDataTable
                url="/admin/settings/faqs/datatable"
                columns={columns}
            />
        </AdminLayout>
    );
}
