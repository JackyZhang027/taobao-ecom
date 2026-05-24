import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

const columns = [
    { data: 'code', title: 'Code', width: '100px' },
    { data: 'name', title: 'Name' },
    {
        data: 'type',
        title: 'Type',
        render: (data: string) => {
            const colors: Record<string, string> = {
                asset:     'bg-blue-100 text-blue-700',
                liability: 'bg-red-100 text-red-700',
                equity:    'bg-purple-100 text-purple-700',
                revenue:   'bg-green-100 text-green-700',
                expense:   'bg-orange-100 text-orange-700',
            };
            const cls = colors[data] ?? 'bg-gray-100 text-gray-700';
            return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent capitalize ${cls}">${data}</span>`;
        },
    },
    {
        data: 'normal_balance',
        title: 'Normal Bal.',
        render: (data: string) => `<span class="capitalize text-sm">${data}</span>`,
    },
    { data: 'parent_name', title: 'Parent', defaultContent: '—' },
    {
        data: 'is_active',
        title: 'Status',
        render: (data: boolean) =>
            data
                ? '<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-green-100 text-green-700">Active</span>'
                : '<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-500">Inactive</span>',
    },
    {
        data: 'id',
        title: '',
        orderable: false,
        searchable: false,
        render: (id: number) =>
            `<div class="flex gap-3">
                <a href="/admin/accounting/accounts/${id}/edit" class="text-primary hover:underline text-sm">Edit</a>
                <button onclick="if(confirm('Delete this account?')) window._acctDelete('/admin/accounting/accounts/${id}')" class="text-destructive hover:underline text-sm">Delete</button>
            </div>`,
    },
];

export default function AccountsIndex() {
    if (typeof window !== 'undefined') {
        (window as any)._acctDelete = (url: string) =>
            router.delete(url, {
                preserveScroll: true,
                onSuccess: () => toast.success('Account deleted.'),
                onError: () => toast.error('Cannot delete this account.'),
            });
    }

    return (
        <AdminLayout>
            <Head title="Chart of Accounts" />
            <AdminPageHeader
                title="Chart of Accounts"
                actions={
                    <Button asChild>
                        <a href="/admin/accounting/accounts/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Account
                        </a>
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>All Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/accounting/accounts/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
