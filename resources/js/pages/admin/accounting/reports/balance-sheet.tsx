import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import type { BalanceSheetData, TrialBalanceRow } from '@/types';

interface Props {
    report: BalanceSheetData;
    filters: { as_of_date: string };
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
                </tbody>
            </table>
            <div className="flex justify-between border-t py-1.5 font-semibold text-sm">
                <span>Total {title}</span>
                <span>{fmt(total)}</span>
            </div>
        </div>
    );
}

export default function BalanceSheet({ report, filters }: Props) {
    const [asOfDate, setAsOfDate] = useState(filters.as_of_date);

    const generate = () => {
        router.get('/admin/accounting/reports/balance-sheet', {
            as_of_date: asOfDate || undefined,
        }, { preserveState: true });
    };

    const isBalanced = Math.abs(report.total_assets - report.total_liab_equity) < 0.01;

    return (
        <AdminLayout>
            <Head title="Balance Sheet" />
            <AdminPageHeader title="Balance Sheet" />

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1">
                            <Label>As of Date</Label>
                            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-44" />
                        </div>
                        <Button onClick={generate}>Generate</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Assets */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Section title="Assets" rows={report.assets} total={report.total_assets} />
                    </CardContent>
                </Card>

                {/* Liabilities + Equity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liabilities &amp; Equity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Section title="Liabilities" rows={report.liabilities} total={report.total_liabilities} />
                        <Section title="Equity" rows={report.equity} total={report.total_equity} />

                        {/* Net Income line */}
                        <div className="border-t pt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Net Income (current period)</span>
                                <span className={`font-medium ${report.net_income < 0 ? 'text-destructive' : 'text-green-700'}`}>
                                    {fmt(report.net_income)}
                                </span>
                            </div>
                        </div>

                        <div className="border-t-2 pt-2 flex justify-between font-bold">
                            <span>Total Liabilities &amp; Equity</span>
                            <span>{fmt(report.total_liab_equity)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Balance check */}
            <div className={`mt-4 rounded-md border px-4 py-3 text-sm font-medium ${isBalanced ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-destructive'}`}>
                {isBalanced
                    ? `Balance sheet is balanced as of ${report.as_of_date}. Assets = ${fmt(report.total_assets)}`
                    : `Out of balance! Assets: ${fmt(report.total_assets)}, Liabilities + Equity: ${fmt(report.total_liab_equity)}`
                }
            </div>
        </AdminLayout>
    );
}
