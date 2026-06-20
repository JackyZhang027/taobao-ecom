import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { FOOTER_SECTIONS } from '@/lib/footer-sections';
import { LOCALES } from '@/lib/locales';

type TranslationData = {
    title: string;
    content: string;
};

export default function AdminPageCreate() {
    const { data, setData, post, processing, errors, transform } = useForm({
        slug: '',
        footer_section: 'none',
        sort_order: '0',
        is_active: true,
        translations: {
            en: { title: '', content: '' },
            id: { title: '', content: '' },
        } as Record<string, TranslationData>,
    });

    const updateTranslation = (locale: string, field: keyof TranslationData, value: string) => {
        setData('translations', {
            ...data.translations,
            [locale]: { ...data.translations[locale], [field]: value },
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((formData) => ({
            ...formData,
            footer_section: formData.footer_section === 'none' ? null : formData.footer_section,
        }));
        post('/admin/settings/pages', {
            onSuccess: () => toast.success('Page created successfully'),
            onError: () => toast.error('Failed to create page'),
        });
    };

    return (
        <AdminLayout breadcrumbs={[
            { title: 'Settings', href: '/admin/settings/shop' },
            { title: 'Pages', href: '/admin/settings/pages' },
            { title: 'Create', href: '' },
        ]}>
            <Head title="Create Page" />

            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Create Page"
                    subtitle="Add a new static content page."
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={() => history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Page'}
                            </Button>
                        </>
                    }
                />

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Page Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="e.g. shipping-policy"
                                />
                                {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="footer_section">Footer Section</Label>
                                    <Select value={data.footer_section} onValueChange={(val) => setData('footer_section', val)}>
                                        <SelectTrigger id="footer_section">
                                            <SelectValue placeholder="Not shown in footer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not shown in footer</SelectItem>
                                            {FOOTER_SECTIONS.map((section) => (
                                                <SelectItem key={section.value} value={section.value}>
                                                    {section.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.footer_section && <p className="text-sm text-red-500">{errors.footer_section}</p>}
                                </div>

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
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="en">
                                <TabsList>
                                    {LOCALES.map((locale) => (
                                        <TabsTrigger key={locale.key} value={locale.key}>
                                            <span className="mr-1.5">{locale.flag}</span>
                                            {locale.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {LOCALES.map((locale) => (
                                    <TabsContent key={locale.key} value={locale.key} className="space-y-4 pt-2">
                                        <div className="space-y-1">
                                            <Label>Title{locale.key === 'en' && <span className="text-red-500"> *</span>}</Label>
                                            <Input
                                                value={data.translations[locale.key].title}
                                                onChange={(e) => updateTranslation(locale.key, 'title', e.target.value)}
                                                placeholder={`Page title in ${locale.label}`}
                                            />
                                            {errors[`translations.${locale.key}.title` as keyof typeof errors] && (
                                                <p className="text-xs text-destructive mt-1">{errors[`translations.${locale.key}.title` as keyof typeof errors]}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Content</Label>
                                            <RichTextEditor
                                                content={data.translations[locale.key].content}
                                                onChange={(html) => updateTranslation(locale.key, 'content', html)}
                                                placeholder={`Page content in ${locale.label}...`}
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AdminLayout>
    );
}
