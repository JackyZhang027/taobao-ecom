import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AccountSelect } from '@/components/accounting/account-select';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import type { Account, LedgerData } from '@/types';

interface Props {
    accounts: Pick<Account, 'id' | 'code' | 'name' | 'type' | 'normal_balance'>[];
    ledger: LedgerData | null;
    filters: {
        account_id: string | null;
        start_date: string | null;
        end_date: string | null;
    };
}

const fmt = (n: number) =>
    new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function LedgerIndex({ accounts, ledger, filters }: Props) {
    const [accountId, setAccountId] = useState(filters.account_id ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');

    const search = () => {
        router.get('/admin/accounting/ledger', {
            account_id: accountId || undefined,
            start_date: startDate || undefined,
            end_date:   endDate   || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="General Ledger" />
            <AdminPageHeader title="General Ledger" />

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Filter Panel */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label>Account</Label>
                                <AccountSelect
                                    accounts={accounts}
                                    value={accountId}
                                    onValueChange={setAccountId}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Start Date</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>End Date</Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={search} disabled={!accountId}>
                                View Ledger
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Ledger Table */}
                <div className="lg:col-span-3">
                    {ledger ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {ledger.account.code} — {ledger.account.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-left">Reference</th>
                                            <th className="px-4 py-3 text-left">Description</th>
                                            <th className="px-4 py-3 text-right">Debit</th>
                                            <th className="px-4 py-3 text-right">Credit</th>
                                            <th className="px-4 py-3 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledger.start_date && (
                                            <tr className="border-b bg-muted/10">
                                                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                                                    {new Date(ledger.start_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2">—</td>
                                                <td className="px-4 py-2 italic text-muted-foreground">Opening balance</td>
                                                <td className="px-4 py-2 text-right">—</td>
                                                <td className="px-4 py-2 text-right">—</td>
                                                <td className="px-4 py-2 text-right font-medium">
                                                    {fmt(ledger.opening_balance)}
                                                </td>
                                            </tr>
                                        )}
                                        {ledger.lines.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        ) : (
                                            ledger.lines.map((line, i) => (
                                                <tr key={i} className="border-b hover:bg-muted/20">
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        {new Date(line.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-xs">{line.reference}</td>
                                                    <td className="px-4 py-2">{line.description}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        {line.debit > 0 ? fmt(line.debit) : '—'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        {line.credit > 0 ? fmt(line.credit) : '—'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium">
                                                        {fmt(line.running_balance)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="border-t bg-muted/20">
                                        <tr>
                                            <td colSpan={5} className="px-4 py-3 font-semibold text-right">
                                                Final Balance
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                {fmt(ledger.final_balance)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="py-16 text-center text-muted-foreground">
                                Select an account to view its ledger.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
