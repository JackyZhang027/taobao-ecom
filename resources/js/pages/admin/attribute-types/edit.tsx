import { Head, useForm, router } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';
import { useState } from 'react';
import type { AttributeType, AttributeValue } from '@/types/product';

interface EditProps {
    attributeType: AttributeType & { values: AttributeValue[] };
}

export default function AdminAttributeTypeEdit({ attributeType }: EditProps) {
    // Attribute type form
    const typeForm = useForm({
        name: attributeType.name,
        name_id: attributeType.name_id ?? '',
        sort_order: String(attributeType.sort_order),
    });

    // New value form
    const newValueForm = useForm({
        value: '',
        value_id: '',
        sort_order: '0',
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ value: '', value_id: '', sort_order: '0' });

    const submitType = (e: React.FormEvent) => {
        e.preventDefault();
        typeForm.put(`/admin/attribute-types/${attributeType.id}`, {
            onSuccess: () => toast.success('Attribute type updated successfully'),
            onError: () => toast.error('Failed to update attribute type'),
        });
    };

    const submitValue = (e: React.FormEvent) => {
        e.preventDefault();
        newValueForm.post(`/admin/attribute-types/${attributeType.id}/values`, {
            onSuccess: () => {
                newValueForm.reset();
                toast.success('Attribute value added successfully');
            },
            onError: () => toast.error('Failed to add attribute value'),
        });
    };

    const startEdit = (val: AttributeValue) => {
        setEditingId(val.id);
        setEditData({ value: val.value, value_id: val.value_id ?? '', sort_order: String(val.sort_order) });
    };

    const saveEdit = (valId: number) => {
        router.put(`/admin/values/${valId}`, editData, {
            onSuccess: () => {
                setEditingId(null);
                toast.success('Attribute value updated successfully');
            },
            onError: () => toast.error('Failed to update attribute value'),
        });
    };

    const deleteValue = (valId: number) => {
        if (confirm('Delete this value?')) {
            router.delete(`/admin/values/${valId}`, {
                onSuccess: () => toast.success('Attribute value deleted successfully'),
                onError: () => toast.error('Failed to delete attribute value'),
            });
        }
    };

    return (
        <AdminLayout>
            <Head title={`Edit: ${attributeType.name}`} />
            <AdminPageHeader
                title="Edit Attribute Type"
                subtitle={attributeType.name}
                actions={
                    <Button type="button" variant="outline" onClick={() => router.visit('/admin/attribute-types')}>
                        Back to List
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — Values */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attribute Values ({attributeType.values?.length ?? 0})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing values */}
                            {(!attributeType.values || attributeType.values.length === 0) ? (
                                <p className="text-sm text-muted-foreground">No values yet. Add one below.</p>
                            ) : (
                                <div className="divide-y">
                                    {attributeType.values.map((val) => (
                                        <div key={val.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                            {editingId === val.id ? (
                                                <>
                                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                                        <Input
                                                            value={editData.value}
                                                            onChange={(e) => setEditData({ ...editData, value: e.target.value })}
                                                            placeholder="Value (EN)"
                                                        />
                                                        <Input
                                                            value={editData.value_id}
                                                            onChange={(e) => setEditData({ ...editData, value_id: e.target.value })}
                                                            placeholder="Value (ID)"
                                                        />
                                                        <Input
                                                            type="number"
                                                            value={editData.sort_order}
                                                            onChange={(e) => setEditData({ ...editData, sort_order: e.target.value })}
                                                            placeholder="Sort"
                                                        />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => saveEdit(val.id)}>
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex-1">
                                                        <span className="font-medium text-sm">{val.value}</span>
                                                        {val.value_id && (
                                                            <span className="text-xs text-muted-foreground ml-2">({val.value_id})</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">#{val.sort_order}</span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(val)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteValue(val.id)}>
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new value */}
                            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    <Plus className="inline h-3 w-3 mr-1" />
                                    Add New Value
                                </p>
                                <form onSubmit={submitValue} className="flex items-end gap-3">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Value (EN)</Label>
                                        <Input
                                            value={newValueForm.data.value}
                                            onChange={(e) => newValueForm.setData('value', e.target.value)}
                                            placeholder="e.g. Blue, XL"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Value (ID)</Label>
                                        <Input
                                            value={newValueForm.data.value_id}
                                            onChange={(e) => newValueForm.setData('value_id', e.target.value)}
                                            placeholder="e.g. Biru, XL"
                                        />
                                    </div>
                                    <div className="w-20 space-y-1">
                                        <Label className="text-xs">Sort</Label>
                                        <Input
                                            type="number"
                                            value={newValueForm.data.sort_order}
                                            onChange={(e) => newValueForm.setData('sort_order', e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" size="sm" disabled={newValueForm.processing}>
                                        Add
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Attribute Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attribute Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitType} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Name (EN)</Label>
                                    <Input
                                        id="name"
                                        value={typeForm.data.name}
                                        onChange={(e) => typeForm.setData('name', e.target.value)}
                                        required
                                    />
                                    {typeForm.errors.name && <p className="text-sm text-destructive">{typeForm.errors.name}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="name_id">Name (ID)</Label>
                                    <Input
                                        id="name_id"
                                        value={typeForm.data.name_id}
                                        onChange={(e) => typeForm.setData('name_id', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={typeForm.data.sort_order}
                                        onChange={(e) => typeForm.setData('sort_order', e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={typeForm.processing} className="w-full">
                                    {typeForm.processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
