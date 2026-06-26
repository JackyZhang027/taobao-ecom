import { Head, useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable  } from '@/components/admin/data-table';
import type {AdminDataTableRef} from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import AdminLayout from '@/layouts/admin-layout';

const columns = [
    {
        data: 'rate',
        title: 'Rate',
        render: (r: number) => `Rp ${Number(r).toLocaleString('id-ID')} / unit`,
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

export default function AdminDeliveryRates() {
    const { data, setData, post, processing, reset, errors } = useForm({ rate: '', notes: '' });
    const tableRef = useRef<AdminDataTableRef>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/delivery-rates', {
            onSuccess: () => {
                reset();
                toast.success('Delivery rate updated successfully');
                tableRef.current?.reload();
            },
            onError: () => {
                toast.error('Failed to update delivery rate. Please check your inputs.');
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Delivery Rates" />
            <AdminPageHeader title="Delivery Rates" />
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Set New Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="rate">Rate (IDR per unit)</Label>
                                <NumberInput
                                    id="rate"
                                    value={data.rate}
                                    onChange={(v) => setData('rate', v)}
                                    placeholder="e.g. 100,000"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Actual delivery charge = product&apos;s delivery rate × this value (e.g. 0.5 × 100,000 = Rp 50,000).
                                </p>
                                {errors.rate && <p className="text-sm text-destructive">{errors.rate}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="e.g. Updated courier pricing"
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
                        <AdminDataTable ref={tableRef} url="/admin/delivery-rates/datatable" columns={columns} />
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
