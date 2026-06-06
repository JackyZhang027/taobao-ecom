import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FEATURE_ICONS, FEATURE_ICON_OPTIONS } from '@/lib/feature-icons';
import type { StoreFeature } from '@/types/settings';

interface Props {
    feature: StoreFeature;
}

const CATEGORIES = ['Delivery', 'Returns', 'Security', 'Payment', 'Support', 'Quality', 'Other'] as const;

export default function AdminStoreFeatureEdit({ feature }: Props) {
    const [iconPickerOpen, setIconPickerOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        icon:        feature.icon,
        title:       feature.title,
        description: feature.description,
        is_active:   feature.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/settings/store-features/${feature.id}`, {
            onSuccess: () => toast.success('Store feature updated successfully'),
            onError: () => toast.error('Failed to update store feature'),
        });
    };

    const SelectedIcon = FEATURE_ICONS[data.icon];

    return (
        <AdminLayout breadcrumbs={[
            { title: 'Settings', href: '/admin/settings/shop' },
            { title: 'Store Features', href: '/admin/settings/store-features' },
            { title: 'Edit', href: '' },
        ]}>
            <Head title="Edit Store Feature" />

            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Edit Store Feature"
                    subtitle={`Editing feature #${feature.sort_order}`}
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={() => history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Feature Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Icon picker */}
                                <div className="space-y-1.5">
                                    <Label>Icon <span className="text-red-500">*</span></Label>
                                    <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between font-normal"
                                            >
                                                <span className="flex items-center gap-2">
                                                    {SelectedIcon ? (
                                                        <SelectedIcon className="h-4 w-4 shrink-0" />
                                                    ) : (
                                                        <span className="w-4 h-4 shrink-0" />
                                                    )}
                                                    {data.icon
                                                        ? (FEATURE_ICON_OPTIONS.find(o => o.value === data.icon)?.label ?? data.icon)
                                                        : 'Select an icon…'}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-3" align="start">
                                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                                {CATEGORIES.map((cat) => {
                                                    const opts = FEATURE_ICON_OPTIONS.filter(o => o.category === cat);
                                                    if (!opts.length) return null;
                                                    return (
                                                        <div key={cat}>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 px-1">{cat}</p>
                                                            <div className="grid grid-cols-5 gap-1">
                                                                {opts.map((opt) => {
                                                                    const Icon = FEATURE_ICONS[opt.value];
                                                                    const isSelected = data.icon === opt.value;
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            title={opt.label}
                                                                            onClick={() => {
                                                                                setData('icon', opt.value);
                                                                                setIconPickerOpen(false);
                                                                            }}
                                                                            className={`flex flex-col items-center gap-1 p-2 rounded-md text-center transition-colors hover:bg-muted ${
                                                                                isSelected
                                                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                                                    : ''
                                                                            }`}
                                                                        >
                                                                            {Icon && <Icon className="h-5 w-5" />}
                                                                            <span className="text-[10px] leading-tight truncate w-full">{opt.label}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.icon && <p className="text-sm text-red-500">{errors.icon}</p>}
                                </div>

                                {/* Title */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. Fast Delivery"
                                        maxLength={100}
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="e.g. Quick processing & nationwide shipping"
                                        maxLength={200}
                                    />
                                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                </div>

                                {/* Active status */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                    />
                                    <Label htmlFor="is_active" className="cursor-pointer">Show on home page</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">How it looks on the home page:</p>
                                <div className="rounded-lg bg-[#EFE9DF] p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                                            {SelectedIcon ? (
                                                <SelectedIcon className="h-8 w-8 text-slate-700" />
                                            ) : (
                                                <div className="h-8 w-8 rounded bg-slate-200" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">
                                                {data.title || 'Feature Title'}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                {data.description || 'Feature description will appear here.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {!data.is_active && (
                                    <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                                        This feature is hidden from the home page.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
