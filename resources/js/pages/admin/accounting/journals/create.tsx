import { Head, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccountSelect } from '@/components/accounting/account-select';
import { NumberInput } from '@/components/ui/number-input';
import AdminLayout from '@/layouts/admin-layout';
import type { Account } from '@/types';

interface Props {
    accounts: Pick<Account, 'id' | 'code' | 'name'>[];
    reference: string;
}

interface LineItem {
    account_id: string;
    description: string;
    debit: string;
    credit: string;
}

const emptyLine = (): LineItem => ({ account_id: '', description: '', debit: '0', credit: '0' });

const fmt = (n: number) =>
    new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function JournalCreate({ accounts, reference }: Props) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [refNumber, setRefNumber] = useState(reference);
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState<LineItem[]>([emptyLine(), emptyLine()]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const totalDebit  = lines.reduce((s, l) => s + parseFloat(l.debit  || '0'), 0);
    const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit || '0'), 0);
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.001;

    const updateLine = (index: number, field: keyof LineItem, value: string) => {
        const updated = [...lines];
        updated[index] = { ...updated[index], [field]: value };
        setLines(updated);
    };

    const addLine = () => setLines([...lines, emptyLine()]);

    const removeLine = (index: number) => {
        if (lines.length <= 2) return;
        setLines(lines.filter((_, i) => i !== index));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            toast.error('Debits must equal credits before submitting.');
            return;
        }
        setProcessing(true);
        router.post('/admin/accounting/journals', {
            date,
            reference_number: refNumber,
            description,
            lines: lines.map((l) => ({
                account_id:  l.account_id,
                description: l.description || null,
                debit:       parseFloat(l.debit  || '0'),
                credit:      parseFloat(l.credit || '0'),
            })),
        }, {
            onSuccess: () => toast.success('Journal entry created.'),
            onError: (errs) => {
                setErrors(errs);
                toast.error('Failed to create journal entry.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout>
            <Head title="New Journal Entry" />
            <div className="mb-6">
                <h1 className="text-2xl font-bold">New Journal Entry</h1>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <CardTitle>Entry Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                                {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="reference">Reference Number *</Label>
                                <Input
                                    id="reference"
                                    value={refNumber}
                                    onChange={(e) => setRefNumber(e.target.value)}
                                />
                                {errors.reference_number && <p className="text-xs text-destructive">{errors.reference_number}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description">Description *</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. Monthly rent payment"
                                />
                                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lines */}
                <Card>
                    <CardHeader>
                        <CardTitle>Journal Lines</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-[35%]">Account</th>
                                        <th className="px-4 py-3 text-left">Description</th>
                                        <th className="px-4 py-3 text-right w-[180px]">Debit</th>
                                        <th className="px-4 py-3 text-right w-[180px]">Credit</th>
                                        <th className="px-4 py-3 w-[40px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="px-4 py-2">
                                                <AccountSelect
                                                    accounts={accounts}
                                                    value={line.account_id}
                                                    onValueChange={(v) => updateLine(i, 'account_id', v)}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    value={line.description}
                                                    onChange={(e) => updateLine(i, 'description', e.target.value)}
                                                    placeholder="Optional"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <NumberInput
                                                    value={line.debit}
                                                    onChange={(v) => updateLine(i, 'debit', v)}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <NumberInput
                                                    value={line.credit}
                                                    onChange={(v) => updateLine(i, 'credit', v)}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(i)}
                                                    disabled={lines.length <= 2}
                                                    className="text-destructive disabled:opacity-30"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t bg-muted/20">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={addLine}
                                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                <Plus className="h-4 w-4" /> Add Line
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">{fmt(totalDebit)}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{fmt(totalCredit)}</td>
                                        <td />
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="px-4 py-2">
                                            {isBalanced ? (
                                                <span className="text-sm font-medium text-green-600">Balanced</span>
                                            ) : (
                                                <span className="text-sm font-medium text-destructive">
                                                    Not balanced — difference: {fmt(Math.abs(totalDebit - totalCredit))}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {errors.lines && (
                            <p className="px-4 py-2 text-sm text-destructive">{errors.lines}</p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={!isBalanced || processing}>
                        Save as Draft
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <a href="/admin/accounting/journals">Cancel</a>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
