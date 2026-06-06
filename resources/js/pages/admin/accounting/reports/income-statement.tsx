import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import type { IncomeStatementData, TrialBalanceRow } from '@/types';

interface Props {
    report: IncomeStatementData;
    filters: { start_date: string; end_date: string };
}

const fmt = (n: number) =>
    new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function Section({ title, rows, total }: { title: string; rows: TrialBalanceRow[]; total: number }) {
    return (
        <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
            <table className="w-full text-sm mb-1">
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-b">
                            <td className="py-1.5 pl-2 text-muted-foreground font-mono text-xs w-[90px]">{row.code}</td>
                            <td className="py-1.5">{row.name}</td>
                            <td className="py-1.5 text-right pr-2">{fmt(row.balance)}</td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={3} className="py-4 text-center text-muted-foreground">No entries.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex justify-between border-t py-1.5 font-semibold text-sm">
                <span>Total {title}</span>
                <span>{fmt(total)}</span>
            </div>
        </div>
    );
}

export default function IncomeStatement({ report, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate]     = useState(filters.end_date   ?? '');

    const generate = () => {
        router.get('/admin/accounting/reports/income-statement', {
            start_date: startDate || undefined,
            end_date:   endDate   || undefined,
        }, { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="Income Statement" />
            <AdminPageHeader title="Income Statement" />

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
                        Income Statement
                        {report.start_date && ` — ${report.start_date} to ${report.end_date ?? 'now'}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <Section title="Revenue" rows={report.revenues} total={report.total_revenue} />
                    <Section title="Expenses" rows={report.expenses} total={report.total_expenses} />

                    <div className="border-t-2 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Net Income</span>
                            <span className={`text-xl font-bold ${report.net_income >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                                {fmt(report.net_income)}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {report.net_income >= 0 ? 'Profit' : 'Loss'} for the period
                        </p>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
