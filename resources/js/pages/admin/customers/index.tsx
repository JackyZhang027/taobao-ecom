import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const columns = [
    { data: 'name', title: 'Name' },
    { data: 'email', title: 'Email' },
    { data: 'phone', title: 'Phone', defaultContent: '—' },
    { data: 'orders_count', title: 'Orders', searchable: false },
    { data: 'created_at', title: 'Registered At', render: (d: string) => new Date(d).toLocaleString() },
];

export default function AdminCustomersIndex() {
    return (
        <AdminLayout>
            <Head title="Customers" />
            <AdminPageHeader title="Customers" />
            <Card>
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/customers/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
