import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminDataTable } from '@/components/admin/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const columns = [
    { data: 'id', title: '#', width: '60px' },
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Orders</h1>
            </div>
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
