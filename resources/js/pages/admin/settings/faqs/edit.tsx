import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { LOCALES } from '@/lib/locales';
import type { Faq } from '@/types/settings';

interface Props {
    faq: Faq;
}

type TranslationData = {
    question: string;
    answer: string;
};

export default function AdminFaqEdit({ faq }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        sort_order: String(faq.sort_order),
        is_active: faq.is_active,
        translations: {
            en: { question: faq.translations.en?.question ?? '', answer: faq.translations.en?.answer ?? '' },
            id: { question: faq.translations.id?.question ?? '', answer: faq.translations.id?.answer ?? '' },
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
        put(`/admin/settings/faqs/${faq.id}`, {
            onSuccess: () => toast.success('FAQ updated successfully'),
            onError: () => toast.error('Failed to update FAQ'),
        });
    };

    return (
        <AdminLayout breadcrumbs={[
            { title: 'Settings', href: '/admin/settings/shop' },
            { title: 'FAQs', href: '/admin/settings/faqs' },
            { title: 'Edit', href: '' },
        ]}>
            <Head title="Edit FAQ" />

            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Edit FAQ"
                    subtitle="Update this question and answer."
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

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>FAQ Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Question &amp; Answer</CardTitle>
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
                                            <Label>Question{locale.key === 'en' && <span className="text-red-500"> *</span>}</Label>
                                            <Input
                                                value={data.translations[locale.key].question}
                                                onChange={(e) => updateTranslation(locale.key, 'question', e.target.value)}
                                                placeholder={`Question in ${locale.label}`}
                                            />
                                            {errors[`translations.${locale.key}.question` as keyof typeof errors] && (
                                                <p className="text-xs text-destructive mt-1">{errors[`translations.${locale.key}.question` as keyof typeof errors]}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Answer</Label>
                                            <Textarea
                                                value={data.translations[locale.key].answer}
                                                onChange={(e) => updateTranslation(locale.key, 'answer', e.target.value)}
                                                placeholder={`Answer in ${locale.label}`}
                                                rows={4}
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
