import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Upload, X, ImageIcon } from 'lucide-react';
import VariantBuilder, { hasMissingOptionImages, type BuilderGroup, type VariantRow } from '@/components/variant-builder';
import type { Category } from '@/types/product';

interface TranslationData {
    name: string;
    description: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
}

interface CreateProps {
    categories: Category[];
    exchangeRate: number;
}

const LOCALES = [
    { key: 'en', label: 'English', flag: 'EN' },
    { key: 'id', label: 'Bahasa Indonesia', flag: 'ID' },
] as const;

const formatRmb = (amount: number) =>
    `¥${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatIdr = (amount: number) =>
    `Rp ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminProductCreate({ categories, exchangeRate }: CreateProps) {
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // VariantBuilder state
    const [builderGroups, setBuilderGroups] = useState<BuilderGroup[]>([]);
    const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

    const [formData, setFormData] = useState({
        slug: '',
        price: '0',
        delivery_charge: '0',
        delivery_charge_batam: '0',
        delivery_charge_jakarta: '0',
        is_active: true,
        sort_order: '0',
        categories: [] as number[],
        translations: {
            en: { name: '', description: '', meta_title: '', meta_description: '', meta_keywords: '' },
            id: { name: '', description: '', meta_title: '', meta_description: '', meta_keywords: '' },
        } as Record<string, TranslationData>,
    });

    const priceRmb = parseFloat(formData.price) || 0;
    const deliveryChargeBatamRmb = parseFloat(formData.delivery_charge_batam) || 0;
    const deliveryChargeJakartaRmb = parseFloat(formData.delivery_charge_jakarta) || 0;
    const finalPriceBatamRmb = priceRmb + deliveryChargeBatamRmb;
    const finalPriceJakartaRmb = priceRmb + deliveryChargeJakartaRmb;

    useEffect(() => {
        if (!slugManuallyEdited && formData.translations.en.name) {
            const slug = formData.translations.en.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            setFormData((prev) => ({ ...prev, slug }));
        }
    }, [formData.translations.en.name, slugManuallyEdited]);

    const updateTranslation = (locale: string, field: keyof TranslationData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            translations: {
                ...prev.translations,
                [locale]: { ...prev.translations[locale], [field]: value },
            },
        }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        setImageFiles((prev) => [...prev, ...files]);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreviews((prev) => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return;
        setImageFiles((prev) => [...prev, ...files]);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreviews((prev) => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (hasMissingOptionImages(builderGroups)) {
            toast.error('All options in the image group must have an image uploaded.');
            return;
        }

        setProcessing(true);

        const fd = new FormData();
        fd.append('slug', formData.slug);
        fd.append('price', formData.price);
        fd.append('delivery_charge', formData.delivery_charge);
        fd.append('delivery_charge_batam', formData.delivery_charge_batam);
        fd.append('delivery_charge_jakarta', formData.delivery_charge_jakarta);
        fd.append('is_active', formData.is_active ? '1' : '0');
        fd.append('sort_order', formData.sort_order);

        formData.categories.forEach((catId) => fd.append('categories[]', String(catId)));

        Object.entries(formData.translations).forEach(([locale, trans]) => {
            Object.entries(trans).forEach(([field, value]) => {
                fd.append(`translations[${locale}][${field}]`, value);
            });
        });

        // Variant groups (structure + per-option images for the image group)
        builderGroups.forEach((group, gi) => {
            fd.append(`variant_groups[${gi}][name]`, group.name);
            fd.append(`variant_groups[${gi}][has_images]`, group.has_images ? '1' : '0');
            group.options.forEach((opt, oi) => {
                fd.append(`variant_groups[${gi}][options][${oi}]`, opt.value);
                if (group.has_images && opt.imageFile) {
                    fd.append(`group_option_images[${gi}][${oi}]`, opt.imageFile);
                }
            });
        });

        // Variant overrides (per-row price/sku/active — no per-row images)
        variantRows.forEach((row, ri) => {
            if (row.variant_id) fd.append(`variant_overrides[${ri}][id]`, String(row.variant_id));
            fd.append(`variant_overrides[${ri}][price]`, row.price);
            fd.append(`variant_overrides[${ri}][sku]`, row.sku);
            fd.append(`variant_overrides[${ri}][is_active]`, row.is_active ? '1' : '0');
        });

        imageFiles.forEach((file) => fd.append('images[]', file));

        router.post('/admin/products', fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Product created successfully'),
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
                toast.error('Failed to create product');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Product" />
            <form onSubmit={submit}>
                <AdminPageHeader
                    title="Create Product"
                    subtitle="Add a new product to your catalog"
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={() => history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Product'}
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN — Content & Variants (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Translations with tabs */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Content &amp; SEO</CardTitle>
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
                                                <Label>Product Name</Label>
                                                <Input
                                                    value={formData.translations[locale.key].name}
                                                    onChange={(e) => updateTranslation(locale.key, 'name', e.target.value)}
                                                    placeholder={`Product name in ${locale.label}`}
                                                    className={errors[`translations.${locale.key}.name`] ? 'border-destructive' : ''}
                                                />
                                                {errors[`translations.${locale.key}.name`] && (
                                                    <p className="text-xs text-destructive mt-1">{errors[`translations.${locale.key}.name`]}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Description</Label>
                                                <RichTextEditor
                                                    content={formData.translations[locale.key].description}
                                                    onChange={(html) => updateTranslation(locale.key, 'description', html)}
                                                    placeholder={`Product description in ${locale.label}...`}
                                                />
                                            </div>

                                            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 space-y-3 mt-4">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    🔍 SEO Meta — {locale.label}
                                                </p>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Meta Title</Label>
                                                    <Input
                                                        value={formData.translations[locale.key].meta_title}
                                                        onChange={(e) => updateTranslation(locale.key, 'meta_title', e.target.value)}
                                                        placeholder="SEO title (max 60 chars recommended)"
                                                        maxLength={255}
                                                    />
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {formData.translations[locale.key].meta_title.length}/60
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Meta Description</Label>
                                                    <textarea
                                                        rows={2}
                                                        value={formData.translations[locale.key].meta_description}
                                                        onChange={(e) => updateTranslation(locale.key, 'meta_description', e.target.value)}
                                                        placeholder="SEO description (max 160 chars recommended)"
                                                        maxLength={500}
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    />
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {formData.translations[locale.key].meta_description.length}/160
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Meta Keywords</Label>
                                                    <Input
                                                        value={formData.translations[locale.key].meta_keywords}
                                                        onChange={(e) => updateTranslation(locale.key, 'meta_keywords', e.target.value)}
                                                        placeholder="keyword1, keyword2, keyword3"
                                                        maxLength={255}
                                                    />
                                                </div>
                                            </div>
                                            {errors.translations && (
                                                <p className="text-sm text-destructive mt-4">{errors.translations}</p>
                                            )}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Variants — Shopee-style builder */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Variants</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <VariantBuilder
                                    initialGroups={[]}
                                    initialVariants={[]}
                                    productSlug={formData.slug}
                                    onChange={(groups, rows) => {
                                        setBuilderGroups(groups);
                                        setVariantRows(rows);
                                    }}
                                />
                                {errors.variant_groups && (
                                    <p className="text-sm text-destructive mt-2">{errors.variant_groups}</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN — Basic Info, Images, Categories (1/3 width) */}
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => {
                                            setSlugManuallyEdited(true);
                                            setFormData((prev) => ({ ...prev, slug: e.target.value }));
                                        }}
                                        placeholder="auto-generated-from-name"
                                        required
                                    />
                                    {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="price">Base Price (RMB) <span className="text-destructive">*</span></Label>
                                    <NumberInput
                                        id="price"
                                        value={formData.price}
                                        onChange={(v) => setFormData((prev) => ({ ...prev, price: v }))}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Used when no variants are configured</p>
                                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="delivery_charge_batam">Delivery Charge — Batam (IDR)</Label>
                                    <NumberInput
                                        id="delivery_charge_batam"
                                        value={formData.delivery_charge_batam}
                                        onChange={(v) => setFormData((prev) => ({ ...prev, delivery_charge_batam: v }))}
                                    />
                                    {errors.delivery_charge_batam && <p className="text-sm text-destructive">{errors.delivery_charge_batam}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="delivery_charge_jakarta">Delivery Charge — Jakarta (IDR)</Label>
                                    <NumberInput
                                        id="delivery_charge_jakarta"
                                        value={formData.delivery_charge_jakarta}
                                        onChange={(v) => setFormData((prev) => ({ ...prev, delivery_charge_jakarta: v }))}
                                    />
                                    {errors.delivery_charge_jakarta && <p className="text-sm text-destructive">{errors.delivery_charge_jakarta}</p>}
                                </div>

                                {/* Final Price Display */}
                                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Final Price</p>
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                            Rate: 1 RMB = {exchangeRate.toLocaleString('en-US')} IDR
                                        </span>
                                    </div>
                                    <div className="flex items-baseline justify-between border-b border-muted pb-1.5 pt-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Price</span>
                                            <span className="text-[10px] text-muted-foreground italic">{formatIdr(priceRmb * exchangeRate)}</span>
                                        </div>
                                        <span className="text-sm font-medium">{formatRmb(priceRmb)}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Batam</p>
                                        <div className="flex items-baseline justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">Delivery</span>
                                                <span className="text-[10px] text-muted-foreground italic">{formatIdr(deliveryChargeBatamRmb * exchangeRate)}</span>
                                            </div>
                                            <span className="text-sm font-medium">{formatRmb(deliveryChargeBatamRmb)}</span>
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-bold">Total</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-sm text-primary">{formatIdr(finalPriceBatamRmb * exchangeRate)}</span>
                                                <span className="text-[10px] text-muted-foreground">{formatRmb(finalPriceBatamRmb)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5 border-t border-muted pt-1.5">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Jakarta</p>
                                        <div className="flex items-baseline justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">Delivery</span>
                                                <span className="text-[10px] text-muted-foreground italic">{formatIdr(deliveryChargeJakartaRmb * exchangeRate)}</span>
                                            </div>
                                            <span className="text-sm font-medium">{formatRmb(deliveryChargeJakartaRmb)}</span>
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-bold">Total</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-sm text-primary">{formatIdr(finalPriceJakartaRmb * exchangeRate)}</span>
                                                <span className="text-[10px] text-muted-foreground">{formatRmb(finalPriceJakartaRmb)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: !!checked }))}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">Drop images here</p>
                                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>

                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1.5 right-1.5 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                                {index === 0 && (
                                                    <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                                        Main
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {imageFiles.length === 0 && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ImageIcon className="h-4 w-4" />
                                        <span>No images added yet</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Categories */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <CardTitle>Categories</CardTitle>
                                {errors.categories && <p className="text-xs text-destructive font-medium">{errors.categories}</p>}
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    {categories.map((cat) => (
                                        <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={formData.categories.includes(cat.id)}
                                                onCheckedChange={(checked) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        categories: checked
                                                            ? [...prev.categories, cat.id]
                                                            : prev.categories.filter((id) => id !== cat.id),
                                                    }))
                                                }
                                            />
                                            {cat.name}
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
