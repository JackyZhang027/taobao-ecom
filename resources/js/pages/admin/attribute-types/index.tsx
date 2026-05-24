import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const columns = [
    { data: 'name', title: 'Name (EN)' },
    { data: 'name_id', title: 'Name (ID)', defaultContent: '—' },
    { data: 'values_list', title: 'Values' },
    { data: 'sort_order', title: 'Sort' },
    {
        data: 'actions',
        title: 'Actions',
        orderable: false,
        searchable: false,
        className: 'text-right',
        render: (id: number) =>
            `<div class="flex justify-end gap-2">
                <a href="/admin/attribute-types/${id}/edit" class="text-primary hover:underline text-sm">Edit</a>
                <button onclick="if(confirm('Delete this attribute type?')) window._inertiaDelete('/admin/attribute-types/${id}')" class="text-destructive hover:underline text-sm">Delete</button>
            </div>`,
    },
];

export default function AdminAttributeTypesIndex() {
    if (typeof window !== 'undefined') {
        (window as any)._inertiaDelete = (url: string) => router.delete(url, {
            onSuccess: () => toast.success('Attribute type deleted successfully'),
            onError: () => toast.error('Failed to delete attribute type'),
        });
    }

    return (
        <AdminLayout>
            <Head title="Attribute Types" />
            <AdminPageHeader
                title="Attribute Types"
                actions={
                    <Button asChild>
                        <a href="/admin/attribute-types/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Attribute
                        </a>
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>All Attributes</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/attribute-types/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
