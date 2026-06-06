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

const columns = [
    { data: 'name', title: 'Name (EN)' },
    { data: 'name_id', title: 'Name (ID)', defaultContent: '—' },
    { data: 'slug', title: 'Slug' },
    { data: 'parent_name', title: 'Parent Category', defaultContent: '—' },
    { data: 'sort_order', title: 'Sort' },
    {
        data: 'actions',
        title: 'Actions',
        orderable: false,
        searchable: false,
        className: 'text-right',
        render: (id: number) =>
            `<div class="flex justify-end gap-2">
                <a href="/admin/categories/${id}/edit" class="text-primary hover:underline text-sm">Edit</a>
                <button onclick="if(confirm('Delete this category?')) window._inertiaDelete('/admin/categories/${id}')" class="text-destructive hover:underline text-sm">Delete</button>
            </div>`,
    },
];

export default function AdminCategoriesIndex() {
    const tableRef = useRef<AdminDataTableRef>(null);

    useEffect(() => {
        (window as any)._inertiaDelete = (url: string) => router.delete(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Category deleted successfully');
                tableRef.current?.reload();
            },
            onError: () => toast.error('Failed to delete category'),
        });
    }, []);

    return (
        <AdminLayout>
            <Head title="Categories" />
            <AdminPageHeader
                title="Categories"
                actions={
                    <Button asChild>
                        <a href="/admin/categories/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                        </a>
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>All Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable ref={tableRef} url="/admin/categories/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
