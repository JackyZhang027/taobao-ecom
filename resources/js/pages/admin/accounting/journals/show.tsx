import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { JournalEntry } from '@/types';

interface Props {
    entry: JournalEntry;
}

const statusVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    draft:  'secondary',
    posted: 'default',
    voided: 'destructive',
};

const fmt = (n: number) =>
    new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function JournalShow({ entry }: Props) {
    const totalDebit  = entry.lines?.reduce((s, l) => s + l.debit,  0) ?? 0;
    const totalCredit = entry.lines?.reduce((s, l) => s + l.credit, 0) ?? 0;

    const handlePost = () => {
        router.post(`/admin/accounting/journals/${entry.id}/post`, {}, {
            onSuccess: () => toast.success('Entry posted successfully.'),
            onError: (errs) => toast.error(Object.values(errs)[0] ?? 'Failed to post entry.'),
        });
    };

    const handleVoid = () => {
        if (!confirm('Void this entry? A reversing entry will be created automatically.')) return;
        router.post(`/admin/accounting/journals/${entry.id}/void`, {}, {
            onSuccess: () => toast.success('Entry voided. Reversing entry created.'),
            onError: (errs) => toast.error(Object.values(errs)[0] ?? 'Failed to void entry.'),
        });
    };

    return (
        <AdminLayout>
            <Head title={`Journal ${entry.reference_number}`} />
            <AdminPageHeader
                title={entry.reference_number}
                actions={
                    <Badge variant={statusVariant[entry.status] ?? 'secondary'} className="capitalize">
                        {entry.status}
                    </Badge>
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Journal Lines</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Account</th>
                                        <th className="px-4 py-3 text-left">Description</th>
                                        <th className="px-4 py-3 text-right">Debit</th>
                                        <th className="px-4 py-3 text-right">Credit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.lines?.map((line) => (
                                        <tr key={line.id} className="border-b">
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{line.account?.code}</p>
                                                <p className="text-xs text-muted-foreground">{line.account?.name}</p>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {line.description ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {line.debit > 0 ? fmt(line.debit) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {line.credit > 0 ? fmt(line.credit) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t bg-muted/20">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 font-semibold">Totals</td>
                                        <td className="px-4 py-3 text-right font-semibold">{fmt(totalDebit)}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{fmt(totalCredit)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Entry Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Description</p>
                                <p className="font-medium">{entry.description}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Created By</p>
                                <p className="font-medium">{entry.creator?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant={statusVariant[entry.status] ?? 'secondary'} className="capitalize mt-1">
                                    {entry.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {entry.status === 'draft' && (
                                <Button className="w-full" onClick={handlePost}>
                                    Post Entry
                                </Button>
                            )}
                            {entry.status === 'posted' && (
                                <Button className="w-full" variant="destructive" onClick={handleVoid}>
                                    Void Entry
                                </Button>
                            )}
                            {entry.status === 'voided' && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    This entry has been voided.
                                </p>
                            )}
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/admin/accounting/journals">Back to List</a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
