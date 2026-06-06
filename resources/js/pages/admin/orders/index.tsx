import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

const columns = [
    { data: 'order_number', title: 'Order #', width: '150px' },
    { data: 'customer_name', title: 'Customer' },
    {
        data: 'status',
        title: 'Status',
        render: (data: string) => {
            const colors: Record<string, string> = {
                pending: 'bg-yellow-100 text-yellow-700',
                confirmed: 'bg-blue-100 text-blue-700',
                processing: 'bg-blue-100 text-blue-700',
                shipped: 'bg-purple-100 text-purple-700',
                delivered: 'bg-green-100 text-green-700',
                cancelled: 'bg-red-100 text-red-700',
            };
            const cls = colors[data] ?? 'bg-gray-100 text-gray-700';
            return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent capitalize ${cls}">${data}</span>`;
        },
    },
    {
        data: 'payment_status',
        title: 'Payment',
        render: (data: string) => {
            const paid = data === 'settlement' || data === 'capture';
            const cls = paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
            const label = paid ? 'Paid' : (data === 'unpaid' ? 'Unpaid' : data);
            return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent capitalize ${cls}">${label}</span>`;
        },
    },
    { data: 'total', title: 'Total' },
    { data: 'created_at', title: 'Date', render: (d: string) => new Date(d).toLocaleDateString() },
    {
        data: 'id',
        title: '',
        orderable: false,
        searchable: false,
        render: (id: number) => `<a href="/admin/orders/${id}" class="text-primary hover:underline text-sm">View</a>`,
    },
];

export default function AdminOrdersIndex() {
    return (
        <AdminLayout>
            <Head title="Orders" />
            <AdminPageHeader title="Orders" />
            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable url="/admin/orders/datatable" columns={columns} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
