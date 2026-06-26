import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['all', 'paid', 'unpaid'];

const DEFAULT_STATUS = 'confirmed';
const DEFAULT_PAYMENT_STATUS = 'paid';

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
    const [status, setStatus] = useState(DEFAULT_STATUS);
    const [paymentStatus, setPaymentStatus] = useState(DEFAULT_PAYMENT_STATUS);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timeout = setTimeout(() => setSearch(searchInput), 400);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const filters = useMemo(
        () => ({
            status,
            payment_status: paymentStatus,
            date_from: dateFrom,
            date_to: dateTo,
            search,
        }),
        [status, paymentStatus, dateFrom, dateTo, search]
    );

    const hasActiveFilters =
        status !== DEFAULT_STATUS || paymentStatus !== DEFAULT_PAYMENT_STATUS || dateFrom !== '' || dateTo !== '' || search !== '';

    const clearFilters = () => {
        setStatus(DEFAULT_STATUS);
        setPaymentStatus(DEFAULT_PAYMENT_STATUS);
        setDateFrom('');
        setDateTo('');
        setSearchInput('');
        setSearch('');
    };

    return (
        <AdminLayout>
            <Head title="Orders" />
            <AdminPageHeader title="Orders" />
            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Status</span>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option} className="capitalize">
                                            {option === 'all' ? 'All statuses' : option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Payment</span>
                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option} className="capitalize">
                                            {option === 'all' ? 'All payments' : option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">From</span>
                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">To</span>
                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Search</span>
                            <Input
                                type="text"
                                placeholder="Order # or customer..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-56"
                            />
                        </div>
                        {hasActiveFilters && (
                            <Button type="button" variant="ghost" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                    <AdminDataTable
                        url="/admin/orders/datatable"
                        columns={columns}
                        filters={filters}
                        options={{ order: [[0, 'desc']] }}
                    />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
