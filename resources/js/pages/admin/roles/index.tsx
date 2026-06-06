import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

const columns = [
    { data: 'name', title: 'Name' },
    { data: 'users_count', title: 'Users', orderable: false, searchable: false },
    { data: 'permissions_count', title: 'Permissions', orderable: false, searchable: false },
    {
        data: 'actions',
        title: 'Actions',
        orderable: false,
        searchable: false,
        className: 'text-right',
        render: (data: { id: number; name: string }) => {
            if (data.name === 'admin') return '';
            return `<div class="flex justify-end gap-2">
                <a href="/admin/roles/${data.id}/edit" class="text-primary hover:underline text-sm">Edit</a>
                <button onclick="if(confirm('Delete this role?')) window._deleteRole('/admin/roles/${data.id}')" class="text-destructive hover:underline text-sm">Delete</button>
            </div>`;
        },
    },
];

export default function RolesIndex() {
    useEffect(() => {
        (window as any)._deleteRole = (url: string) =>
            router.delete(url, {
                preserveScroll: true,
                onSuccess: () => toast.success('Role deleted'),
                onError: () => toast.error('Failed to delete role'),
            });
    }, []);

    return (
        <AdminLayout>
            <Head title="Roles" />
            <AdminPageHeader
                title="Roles"
                actions={
                    <Button asChild>
                        <a href="/admin/roles/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </a>
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>All Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/roles/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
