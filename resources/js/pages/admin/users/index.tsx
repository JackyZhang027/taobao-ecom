import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const columns = [
    { data: 'name', title: 'Name' },
    { data: 'email', title: 'Email' },
    { data: 'role', title: 'Role', orderable: false, searchable: false },
    { data: 'created_at', title: 'Created At', render: (d: string) => new Date(d).toLocaleString() },
    {
        data: 'actions',
        title: 'Actions',
        orderable: false,
        searchable: false,
        className: 'text-right',
        render: (id: number) =>
            `<div class="flex justify-end gap-2">
                <a href="/admin/users/${id}/edit" class="text-primary hover:underline text-sm">Edit</a>
                <button onclick="if(confirm('Delete this admin user?')) window._deleteAdminUser('/admin/users/${id}')" class="text-destructive hover:underline text-sm">Delete</button>
            </div>`,
    },
];

export default function AdminUsersIndex() {
    if (typeof window !== 'undefined') {
        (window as any)._deleteAdminUser = (url: string) =>
            router.delete(url, {
                preserveScroll: true,
                onSuccess: () => toast.success('Admin user deleted'),
                onError: () => toast.error('Failed to delete admin user'),
            });
    }

    return (
        <AdminLayout>
            <Head title="Users" />
            <AdminPageHeader
                title="Users"
                actions={
                    <Button asChild>
                        <a href="/admin/users/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create User
                        </a>
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/users/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
