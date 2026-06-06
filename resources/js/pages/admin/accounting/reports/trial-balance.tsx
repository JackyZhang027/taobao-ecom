import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import type { TrialBalanceRow } from '@/types';

interface Props {
    rows: TrialBalanceRow[];
    filters: { start_date: string | null; end_date: string | null };
}

const fmt = (n: number) =>
    new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const typeColors: Record<string, string> = {
    asset:     'bg-blue-50',
    liability: 'bg-red-50',
    equity:    'bg-purple-50',
    revenue:   'bg-green-50',
    expense:   'bg-orange-50',
};

export default function TrialBalance({ rows, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');

    const generate = () => {
        router.get('/admin/accounting/reports/trial-balance', {
            start_date: startDate || undefined,
            end_date:   endDate   || undefined,
        }, { preserveState: true });
    };

    const totalDebit  = rows.reduce((s, r) => s + r.total_debit,  0);
    const totalCredit = rows.reduce((s, r) => s + r.total_credit, 0);

    return (
        <AdminLayout>
            <Head title="Trial Balance" />
            <AdminPageHeader title="Trial Balance" />

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1">
                            <Label>Start Date</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-44" />
                        </div>
                        <div className="space-y-1">
                            <Label>End Date</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-44" />
                        </div>
                        <Button onClick={generate}>Generate</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Trial Balance
                        {filters.start_date && ` — ${filters.start_date} to ${filters.end_date ?? 'now'}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left w-[100px]">Code</th>
                                <th className="px-4 py-3 text-left">Account Name</th>
                                <th className="px-4 py-3 text-left w-[100px]">Type</th>
                                <th className="px-4 py-3 text-right w-[140px]">Debit</th>
                                <th className="px-4 py-3 text-right w-[140px]">Credit</th>
                                <th className="px-4 py-3 text-right w-[140px]">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className={`border-b ${typeColors[row.type] ?? ''}`}>
                                    <td className="px-4 py-2 font-mono text-xs">{row.code}</td>
                                    <td className="px-4 py-2">{row.name}</td>
                                    <td className="px-4 py-2 capitalize text-muted-foreground">{row.type}</td>
                                    <td className="px-4 py-2 text-right">{row.total_debit > 0 ? fmt(row.total_debit) : '—'}</td>
                                    <td className="px-4 py-2 text-right">{row.total_credit > 0 ? fmt(row.total_credit) : '—'}</td>
                                    <td className={`px-4 py-2 text-right font-medium ${row.balance < 0 ? 'text-destructive' : ''}`}>
                                        {fmt(row.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 bg-muted/30">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 font-bold">Totals</td>
                                <td className="px-4 py-3 text-right font-bold">{fmt(totalDebit)}</td>
                                <td className="px-4 py-3 text-right font-bold">{fmt(totalCredit)}</td>
                                <td className={`px-4 py-3 text-right font-bold ${Math.abs(totalDebit - totalCredit) > 0.01 ? 'text-destructive' : 'text-green-700'}`}>
                                    {Math.abs(totalDebit - totalCredit) < 0.01 ? 'Balanced' : fmt(totalDebit - totalCredit)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
