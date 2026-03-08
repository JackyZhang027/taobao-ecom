import { Head, useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminDataTable, type AdminDataTableRef } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const columns = [
    {
        data: 'rate',
        title: 'Rate',
        render: (r: number) => `1 RMB = ${Number(r).toFixed(2)} IDR`,
    },
    {
        data: 'active_label',
        title: 'Status',
        render: (d: string) =>
            d === 'Active'
                ? '<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-transparent">Active</span>'
                : '',
    },
    { data: 'creator_name', title: 'Set By' },
    { data: 'notes', title: 'Notes', defaultContent: '—' },
    { data: 'created_at', title: 'Date', render: (d: string) => new Date(d).toLocaleString() },
];

export default function AdminExchangeRates() {
    const { data, setData, post, processing, reset, errors } = useForm({ rate: '', notes: '' });
    const tableRef = useRef<AdminDataTableRef>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/exchange-rates', {
            onSuccess: () => {
                reset();
                toast.success('Exchange rate updated successfully');
                tableRef.current?.reload();
            },
            onError: () => {
                toast.error('Failed to update exchange rate. Please check your inputs.');
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Exchange Rates" />
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Exchange Rates</h1>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Set New Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="rate">Rate (1 RMB = X IDR)</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={data.rate}
                                    onChange={(e) => setData('rate', e.target.value)}
                                    required
                                />
                                {errors.rate && <p className="text-sm text-destructive">{errors.rate}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="e.g. Source: Bank Indonesia"
                                />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">
                                Set Rate
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Rate History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AdminDataTable ref={tableRef} url="/admin/exchange-rates/datatable" columns={columns} />
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
