import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import type { ShopSetting } from '@/types/settings';

export default function AdminShopSettings({ settings }: { settings: ShopSetting }) {
    const { data, setData, post, processing } = useForm<{
        settings: Record<string, any>;
        favicon: File | null;
        logo: File | null;
    }>({
        settings: {
            shop_name: settings.shop_name || '',
            description: settings.description || '',
            meta_title: settings.meta_title || '',
            meta_description: settings.meta_description || '',
            meta_keywords: settings.meta_keywords || '',
            contact_email: settings.contact_email || '',
            contact_phone: settings.contact_phone || '',
            whatsapp_number: settings.whatsapp_number || '',
        },
        favicon: null,
        logo: null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings/shop', {
            forceFormData: true,
            onSuccess: () => toast.success('Shop settings updated successfully'),
            onError: () => toast.error('Failed to update settings'),
        });
    };

    return (
        <AdminLayout breadcrumbs={[{ title: 'Settings', href: '/admin/settings/shop' }, { title: 'General', href: '' }]}>
            <Head title="Shop Settings" />

            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Shop Settings"
                    subtitle="Manage global information and SEO data for your store"
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
                                <CardTitle>General Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="shop_name">Shop / App Name</Label>
                                    <Input
                                        id="shop_name"
                                        value={data.settings.shop_name}
                                        onChange={(e: any) => setData('settings', { ...data.settings, shop_name: e.target.value })}
                                        placeholder="Enter the name of your shop"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="logo">Logo Image</Label>
                                        {(settings as any).logo && (
                                            <div className="mb-2">
                                                <img src={(settings as any).logo} alt="Logo" className="h-12 w-auto object-contain bg-muted/50 p-2 rounded" />
                                            </div>
                                        )}
                                        <Input
                                            id="logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e: any) => setData('logo', e.target.files?.[0] || null)}
                                        />
                                        <p className="text-xs text-muted-foreground">Will be used in the navbar and auth layouts.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="favicon">Favicon</Label>
                                        {(settings as any).favicon && (
                                            <div className="mb-2">
                                                <img src={(settings as any).favicon} alt="Favicon" className="h-8 w-8 object-contain bg-muted/50 p-1 rounded" />
                                            </div>
                                        )}
                                        <Input
                                            id="favicon"
                                            type="file"
                                            accept="image/x-icon,image/png,image/svg+xml"
                                            onChange={(e: any) => setData('favicon', e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="description">Short Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.settings.description}
                                        onChange={(e: any) => setData('settings', { ...data.settings, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                <div className="space-y-1">
                                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                                    <Input
                                        id="whatsapp_number"
                                        value={data.settings.whatsapp_number}
                                        onChange={(e: any) => setData('settings', { ...data.settings, whatsapp_number: e.target.value })}
                                        placeholder="e.g. 6281234567890 (no + or spaces)"
                                    />
                                    <p className="text-xs text-muted-foreground">Used for the "Order Other Locations" WhatsApp button on the shop page.</p>
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
