import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface ValueRow {
    value: string;
    value_id: string;
    sort_order: string;
}

export default function AdminAttributeTypeCreate() {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [name, setName] = useState('');
    const [nameId, setNameId] = useState('');
    const [sortOrder, setSortOrder] = useState('0');
    const [values, setValues] = useState<ValueRow[]>([]);

    const addValue = () => {
        setValues((prev) => [...prev, { value: '', value_id: '', sort_order: String(prev.length) }]);
    };

    const updateValue = (index: number, field: keyof ValueRow, val: string) => {
        setValues((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: val } : v)));
    };

    const removeValue = (index: number) => {
        setValues((prev) => prev.filter((_, i) => i !== index));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const payload: Record<string, any> = {
            name,
            name_id: nameId,
            sort_order: sortOrder,
            values: values.filter((v) => v.value.trim() !== ''),
        };

        router.post('/admin/attribute-types', payload, {
            onSuccess: () => toast.success('Attribute type created successfully'),
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
                toast.error('Failed to create attribute type');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Attribute Type" />
            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Create Attribute Type"
                    subtitle="Define a new attribute with its values"
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={() => history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Attribute'}
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left — Values */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Attribute Values</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addValue}>
                                    <Plus className="mr-1 h-4 w-4" /> Add Value
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {values.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No values yet. Click &quot;Add Value&quot; to add one (e.g. Blue, Red for Color).
                                    </p>
                                )}
                                {values.map((val, index) => (
                                    <div key={index} className="flex items-end gap-3">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Value (EN)</Label>
                                            <Input
                                                value={val.value}
                                                onChange={(e) => updateValue(index, 'value', e.target.value)}
                                                placeholder="e.g. Blue, XL, Cotton"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Value (ID)</Label>
                                            <Input
                                                value={val.value_id}
                                                onChange={(e) => updateValue(index, 'value_id', e.target.value)}
                                                placeholder="e.g. Biru, XL, Katun"
                                            />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <Label className="text-xs">Sort</Label>
                                            <Input
                                                type="number"
                                                value={val.sort_order}
                                                onChange={(e) => updateValue(index, 'sort_order', e.target.value)}
                                            />
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeValue(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right — Basic Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attribute Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Name (EN)</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Color, Size, Material"
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="name_id">Name (ID)</Label>
                                    <Input
                                        id="name_id"
                                        value={nameId}
                                        onChange={(e) => setNameId(e.target.value)}
                                        placeholder="e.g. Warna, Ukuran, Bahan"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
