import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminDataTable  } from '@/components/admin/data-table';
import type {AdminDataTableRef} from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';

interface SelectedCustomer {
    id: number;
    name: string;
}

type PasswordMode = 'generate' | 'manual';

function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const bytes = new Uint32Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

const columns = [
    { data: 'name', title: 'Name' },
    { data: 'email', title: 'Email' },
    { data: 'phone', title: 'Phone', defaultContent: '—' },
    { data: 'orders_count', title: 'Orders', searchable: false },
    { data: 'created_at', title: 'Registered At', render: (d: string) => new Date(d).toLocaleString() },
    {
        data: 'actions',
        title: 'Actions',
        orderable: false,
        searchable: false,
        render: (id: number, _type: string, row: { name: string }) => {
            const safeName = JSON.stringify(row.name).replace(/"/g, '&quot;');
            return `<button
                onclick="window._openResetModal(${id}, ${safeName})"
                class="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >Reset Password</button>`;
        },
    },
];

export default function AdminCustomersIndex() {
    const tableRef = useRef<AdminDataTableRef>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [mode, setMode] = useState<PasswordMode>('generate');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        (window as any)._openResetModal = (id: number, name: string) => {
            setSelectedCustomer({ id, name });
            setMode('generate');
            setGeneratedPassword(generatePassword());
            setPassword('');
            setPasswordConfirmation('');
            setMustChangePassword(false);
            setDialogOpen(true);
        };

        return () => {
            delete (window as any)._openResetModal;
        };
    }, []);

    const handleModeChange = (newMode: PasswordMode) => {
        setMode(newMode);
        if (newMode === 'generate') {
            setGeneratedPassword(generatePassword());
            setPassword('');
            setPasswordConfirmation('');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPassword).then(() => {
            toast.success('Password copied to clipboard');
        });
    };

    const handleSubmit = () => {
        if (!selectedCustomer) return;

        const finalPassword = mode === 'generate' ? generatedPassword : password;
        const finalConfirmation = mode === 'generate' ? generatedPassword : passwordConfirmation;

        if (!finalPassword) {
            toast.error('Password is required');
            return;
        }

        if (mode === 'manual' && finalPassword !== finalConfirmation) {
            toast.error('Passwords do not match');
            return;
        }

        setProcessing(true);
        router.post(
            `/admin/customers/${selectedCustomer.id}/reset-password`,
            {
                password: finalPassword,
                password_confirmation: finalConfirmation,
                must_change_password: mustChangePassword,
            },
            {
                onSuccess: () => {
                    toast.success(`Password reset for ${selectedCustomer.name}`);
                    setDialogOpen(false);
                    tableRef.current?.reload();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Failed to reset password');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Customers" />
            <AdminPageHeader title="Customers" />
            <Card>
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminDataTable
                        ref={tableRef}
                        url="/admin/customers/datatable"
                        columns={columns}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Reset the password for{' '}
                            <span className="font-medium text-foreground">
                                {selectedCustomer?.name}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={mode === 'generate' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleModeChange('generate')}
                            >
                                Generate password
                            </Button>
                            <Button
                                type="button"
                                variant={mode === 'manual' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleModeChange('manual')}
                            >
                                Set manually
                            </Button>
                        </div>

                        {mode === 'generate' ? (
                            <div className="space-y-2">
                                <Label>Generated password</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={generatedPassword}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={copyToClipboard}>
                                        Copy
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setGeneratedPassword(generatePassword())}
                                    >
                                        Regenerate
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="new-password">New password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="confirm-password">Confirm password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        placeholder="Repeat new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 rounded-md border p-3">
                            <Checkbox
                                id="must-change"
                                checked={mustChangePassword}
                                onCheckedChange={(checked) =>
                                    setMustChangePassword(checked === true)
                                }
                            />
                            <Label htmlFor="must-change" className="cursor-pointer font-normal">
                                Force customer to change password on next login
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={processing}>
                            {processing ? 'Resetting...' : 'Reset password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
