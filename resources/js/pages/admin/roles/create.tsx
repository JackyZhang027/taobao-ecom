import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

interface Props {
    permissions: Record<string, Permission[]>;
}

export default function RolesCreate({ permissions }: Props) {
    const [name, setName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const formatGroup = (group: string) =>
        group.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const togglePermission = (permName: string, checked: boolean) => {
        setSelectedPermissions((prev) =>
            checked ? [...prev, permName] : prev.filter((p) => p !== permName),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(
            '/admin/roles',
            { name, permissions: selectedPermissions },
            {
                onSuccess: () => toast.success('Role created successfully'),
                onError: (errs) => {
                    setErrors(errs);
                    setProcessing(false);
                    toast.error('Failed to create role');
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Create Role" />
            <AdminPageHeader
                title="Create Role"
                actions={
                    <Button variant="outline" asChild>
                        <a href="/admin/roles">Back</a>
                    </Button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Role Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="name">
                                Role Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. accounting, sales"
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(permissions)
                            .filter(([group]) => group !== 'admin')
                            .map(([group, perms]) => (
                                <div key={group} className="space-y-2">
                                    <h4 className="text-sm font-semibold">{formatGroup(group)}</h4>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {perms.map((perm) => (
                                            <label
                                                key={perm.name}
                                                className="flex cursor-pointer items-center gap-2 text-sm"
                                            >
                                                <Checkbox
                                                    checked={selectedPermissions.includes(perm.name)}
                                                    onCheckedChange={(checked) =>
                                                        togglePermission(perm.name, !!checked)
                                                    }
                                                />
                                                {perm.name.split('.')[1]}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        {errors.permissions && (
                            <p className="text-sm text-destructive">{errors.permissions}</p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Creating...' : 'Create Role'}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
