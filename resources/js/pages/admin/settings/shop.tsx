import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ShopSetting } from '@/types/settings';

export default function AdminShopSettings({ settings }: { settings: ShopSetting }) {
    const { data, setData, post, processing, errors } = useForm({
        settings: {
            shop_name: settings.shop_name || '',
            description: settings.description || '',
            meta_title: settings.meta_title || '',
            meta_description: settings.meta_description || '',
            meta_keywords: settings.meta_keywords || '',
            contact_email: settings.contact_email || '',
            contact_phone: settings.contact_phone || '',
        }
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings/shop', {
            onSuccess: () => toast.success('Shop settings updated successfully'),
            onError: () => toast.error('Failed to update settings'),
        });
    };

    return (
        <AdminLayout breadcrumbs={[{ title: 'Settings', href: '/admin/settings/shop' }, { title: 'General', href: '' }]}>
            <Head title="Shop Settings" />

            <form onSubmit={submit}>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Shop Settings</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage global information and SEO data for your store</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="shop_name">Shop Name</Label>
                                    <Input
                                        id="shop_name"
                                        value={data.settings.shop_name}
                                        onChange={(e: any) => setData('settings', { ...data.settings, shop_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="description">Short Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.settings.description}
                                        onChange={(e: any) => setData('settings', { ...data.settings, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="contact_email">Contact Email</Label>
                                        <Input
                                            id="contact_email"
                                            type="email"
                                            value={data.settings.contact_email}
                                            onChange={(e: any) => setData('settings', { ...data.settings, contact_email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="contact_phone">Contact Phone</Label>
                                        <Input
                                            id="contact_phone"
                                            value={data.settings.contact_phone}
                                            onChange={(e: any) => setData('settings', { ...data.settings, contact_phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="meta_title">Meta Title Defaults</Label>
                                    <Input
                                        id="meta_title"
                                        value={data.settings.meta_title}
                                        onChange={(e: any) => setData('settings', { ...data.settings, meta_title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="meta_description">Meta Description</Label>
                                    <Textarea
                                        id="meta_description"
                                        value={data.settings.meta_description}
                                        onChange={(e: any) => setData('settings', { ...data.settings, meta_description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="meta_keywords">Meta Keywords</Label>
                                    <Input
                                        id="meta_keywords"
                                        value={data.settings.meta_keywords}
                                        onChange={(e: any) => setData('settings', { ...data.settings, meta_keywords: e.target.value })}
                                        placeholder="Comma separated"
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
