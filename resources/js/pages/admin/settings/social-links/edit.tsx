import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SocialIcon, SOCIAL_ICON_OPTIONS } from '@/lib/social-icons';
import type { SocialLink } from '@/types/settings';

interface Props {
    socialLink: SocialLink;
}

export default function AdminSocialLinkEdit({ socialLink }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: socialLink.name,
        icon: socialLink.icon,
        url: socialLink.url,
        sort_order: String(socialLink.sort_order),
        is_active: socialLink.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/settings/social-links/${socialLink.id}`, {
            onSuccess: () => toast.success('Social link updated successfully'),
            onError: () => toast.error('Failed to update social link'),
        });
    };

    return (
        <AdminLayout breadcrumbs={[
            { title: 'Settings', href: '/admin/settings/shop' },
            { title: 'Social Links', href: '/admin/settings/social-links' },
            { title: 'Edit', href: '' },
        ]}>
            <Head title="Edit Social Link" />

            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Edit Social Link"
                    subtitle={`Editing: ${socialLink.name}`}
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
                                <CardTitle>Link Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Platform Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Facebook"
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="icon">Icon <span className="text-red-500">*</span></Label>
                                    <Select value={data.icon} onValueChange={(val) => setData('icon', val)}>
                                        <SelectTrigger id="icon">
                                            <SelectValue placeholder="Select an icon..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SOCIAL_ICON_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <span className="flex items-center gap-2">
                                                        <SocialIcon icon={opt.value} className="w-4 h-4" />
                                                        {opt.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.icon && <p className="text-sm text-red-500">{errors.icon}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="url">Profile URL <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="url"
                                        type="url"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                        placeholder="https://facebook.com/yourpage"
                                    />
                                    {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="sort_order">Sort Order</Label>
                                        <Input
                                            id="sort_order"
                                            type="number"
                                            value={data.sort_order}
                                            onChange={(e) => setData('sort_order', e.target.value)}
                                        />
                                        {errors.sort_order && <p className="text-sm text-red-500">{errors.sort_order}</p>}
                                    </div>

                                    <div className="flex flex-col justify-end space-y-2 pb-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_active"
                                                checked={data.is_active}
                                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                            />
                                            <Label htmlFor="is_active">Active</Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Icon Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                        {data.icon ? (
                                            <SocialIcon icon={data.icon} className="w-5 h-5" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">?</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{data.name || 'Platform Name'}</p>
                                        <p className="text-xs text-muted-foreground">{data.icon || 'No icon selected'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
