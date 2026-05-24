import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountSelect } from '@/components/accounting/account-select';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { Account, AccountType } from '@/types';

interface Props {
    accounts: Pick<Account, 'id' | 'code' | 'name'>[];
    types: AccountType[];
}

const normalBalanceForType = (type: AccountType): string =>
    ['asset', 'expense'].includes(type) ? 'debit' : 'credit';

export default function AccountCreate({ accounts, types }: Props) {
    const [form, setForm] = useState({
        code: '',
        name: '',
        type: '' as AccountType | '',
        parent_id: '',
        description: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/admin/accounting/accounts', form, {
            onSuccess: () => toast.success('Account created successfully.'),
            onError: (errs) => {
                setErrors(errs);
                toast.error('Failed to create account.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Account" />
            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Create Account"
                    subtitle="Add a new account to the chart of accounts"
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Account'}
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="code">Account Code <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="code"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        placeholder="e.g. 1000"
                                    />
                                    {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="name">Account Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Cash"
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label>Account Type <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={form.type}
                                        onValueChange={(v) => setForm({ ...form, type: v as AccountType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((t) => (
                                                <SelectItem key={t} value={t} className="capitalize">
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label>Normal Balance</Label>
                                    <Input
                                        value={form.type ? normalBalanceForType(form.type as AccountType) : '—'}
                                        readOnly
                                        className="bg-muted capitalize"
                                    />
                                    <p className="text-xs text-muted-foreground">Automatically determined by account type.</p>
                                </div>

                                <div className="space-y-1">
                                    <Label>Parent Account</Label>
                                    <AccountSelect
                                        accounts={accounts}
                                        value={form.parent_id}
                                        onValueChange={(v) => setForm({ ...form, parent_id: v })}
                                        includeNone
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Optional description"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm">Active</span>
                                </label>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
