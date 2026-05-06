import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Trash2, Plus, Upload, X, ImageIcon } from 'lucide-react';
import type { AttributeType, Category, Product, ProductMedia } from '@/types/product';

interface VariantRow {
    id?: number;
    sku: string;
    price: string;
    is_active: boolean;
    sort_order: string;
    attribute_value_ids: number[];
    existingImageUrl?: string | null;
    imageFile?: File | null;
    imagePreview?: string | null;
}

interface TranslationData {
    name: string;
    description: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
}

interface EditProps {
    product: Product;
    categories: Category[];
    attributeTypes: AttributeType[];
    productMedia: ProductMedia[];
    exchangeRate: number;
}

const LOCALES = [
    { key: 'en', label: 'English', flag: 'EN' },
    { key: 'id', label: 'Bahasa Indonesia', flag: 'ID' },
] as const;

const formatRmb = (amount: number) => `¥${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatIdr = (amount: number) => `Rp ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminProductEdit({ product, categories, attributeTypes, productMedia, exchangeRate }: EditProps) {
    const enTranslation = product.translations?.find((t) => t.locale === 'en');
    const idTranslation = product.translations?.find((t) => t.locale === 'id');

    const initialVariants: VariantRow[] =
        product.variants?.map((v) => ({
            id: v.id,
            sku: v.sku ?? '',
            price: String(v.price ?? 0),
            is_active: v.is_active ?? true,
            sort_order: String(v.sort_order ?? 0),
            attribute_value_ids: (v.attribute_values || v.attributeValues)?.map((av: any) => av.id) ?? [],
            existingImageUrl: v.image_url ?? null,
            imageFile: null,
            imagePreview: null,
        })) ?? [];

    const [slugManuallyEdited, setSlugManuallyEdited] = useState(true);
    const [variants, setVariants] = useState<VariantRow[]>(initialVariants);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [existingMedia, setExistingMedia] = useState<ProductMedia[]>(productMedia ?? []);
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        slug: product.slug,
        price: String(product.price ?? 0),
        delivery_charge: String(product.delivery_charge ?? 0),
        delivery_charge_batam: String((product as any).delivery_charge_batam ?? 0),
        delivery_charge_jakarta: String((product as any).delivery_charge_jakarta ?? 0),
        is_active: product.is_active,
        sort_order: String(product.sort_order),
        categories: product.categories?.map((c) => c.id) ?? [],
        translations: {
            en: {
                name: enTranslation?.name ?? '',
                description: enTranslation?.description ?? '',
                meta_title: enTranslation?.meta_title ?? '',
                meta_description: enTranslation?.meta_description ?? '',
                meta_keywords: enTranslation?.meta_keywords ?? '',
            },
            id: {
                name: idTranslation?.name ?? '',
                description: idTranslation?.description ?? '',
                meta_title: idTranslation?.meta_title ?? '',
                meta_description: idTranslation?.meta_description ?? '',
                meta_keywords: idTranslation?.meta_keywords ?? '',
            },
        } as Record<string, TranslationData>,
    });

    // Computed final price
    const priceRmb = parseFloat(formData.price) || 0;
    const deliveryChargeBatamIdr = parseFloat(formData.delivery_charge_batam) || 0;
    const deliveryChargeJakartaIdr = parseFloat(formData.delivery_charge_jakarta) || 0;
    const priceIdr = priceRmb * exchangeRate;
    const finalPriceBatamIdr = priceIdr + deliveryChargeBatamIdr;
    const finalPriceJakartaIdr = priceIdr + deliveryChargeJakartaIdr;

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

    const addVariant = () => {
        setVariants((prev) => [
            ...prev,
            { sku: '', price: '0', is_active: true, sort_order: '0', attribute_value_ids: [], existingImageUrl: null, imageFile: null, imagePreview: null },
        ]);
    };

    const handleVariantImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setVariants((prev) => prev.map((v, i) =>
                i === index ? { ...v, imageFile: file, imagePreview: ev.target?.result as string } : v
            ));
        };
        reader.readAsDataURL(file);
    };

    const updateVariant = (index: number, field: keyof VariantRow, value: any) => {
        setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
    };

    const removeVariant = (index: number) => {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    };

    const selectAttributeValue = (variantIndex: number, attributeType: AttributeType, valueId: number) => {
        const allValueIdsForType = (attributeType.values ?? []).map((v) => v.id);
        const current = variants[variantIndex].attribute_value_ids.filter((id) => !allValueIdsForType.includes(id));
        updateVariant(variantIndex, 'attribute_value_ids', [...current, valueId]);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        setNewImageFiles((prev) => [...prev, ...files]);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeNewImage = (index: number) => {
        setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
        setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (mediaId: number) => {
        setDeletedImageIds((prev) => [...prev, mediaId]);
        setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return;

        setNewImageFiles((prev) => [...prev, ...files]);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Validate: each variant must have at least one attribute selected
        if (variants.length > 0 && attributeTypes.length > 0) {
            const invalid = variants.some((v) => v.attribute_value_ids.length === 0);
            if (invalid) {
                setErrors({ variants: 'Each variant must have at least one attribute selected.' });
                setProcessing(false);
                return;
            }
        }

        // Validate: each variant must have an image (existing or newly uploaded)
        if (variants.length > 0) {
            const missingImage = variants.some((v) => !v.existingImageUrl && !v.imageFile);
            if (missingImage) {
                setErrors({ variants_image: 'Each variant must have an image.' });
                setProcessing(false);
                return;
            }
        }

        const fd = new FormData();
        fd.append('_method', 'PUT');
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

        variants.forEach((variant, vi) => {
            if (variant.id) {
                fd.append(`variants[${vi}][id]`, String(variant.id));
            }
            Object.entries(variant).forEach(([field, value]) => {
                if (field === 'id') return;
                if (field === 'attribute_value_ids') {
                    (value as number[]).forEach((id) => fd.append(`variants[${vi}][attribute_value_ids][]`, String(id)));
                } else if (field === 'is_active') {
                    fd.append(`variants[${vi}][${field}]`, value ? '1' : '0');
                } else {
                    fd.append(`variants[${vi}][${field}]`, String(value));
                }
            });
        });

        deletedImageIds.forEach((id) => fd.append('deleted_images[]', String(id)));
        newImageFiles.forEach((file) => fd.append('images[]', file));

        variants.forEach((variant, vi) => {
            if (variant.imageFile) {
                fd.append(`variants[${vi}][image]`, variant.imageFile);
            }
        });

        router.post(`/admin/products/${product.id}`, fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Product updated successfully'),
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
                toast.error('Failed to update product');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit: ${product.slug}`} />
            <form onSubmit={submit}>
                {/* Page Header with buttons */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Edit Product</h1>
                        <p className="text-sm text-muted-foreground mt-1">{product.slug}</p>
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
                                                    value={formData.translations[locale.key]?.name || ''}
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
                                                {errors[`translations.${locale.key}.description`] && (
                                                    <p className="text-xs text-destructive mt-1">{errors[`translations.${locale.key}.description`]}</p>
                                                )}
                                            </div>

                                            {/* SEO Meta Section */}
                                            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 space-y-3 mt-4">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    🔍 SEO Meta — {locale.label}
                                                </p>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Meta Title</Label>
                                                    <Input
                                                        value={formData.translations[locale.key]?.meta_title || ''}
                                                        onChange={(e) => updateTranslation(locale.key, 'meta_title', e.target.value)}
                                                        placeholder="SEO title (max 60 chars recommended)"
                                                        maxLength={255}
                                                        className={errors[`translations.${locale.key}.meta_title`] ? 'border-destructive' : ''}
                                                    />
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {formData.translations[locale.key].meta_title.length}/60
                                                    </p>
                                                    {errors[`translations.${locale.key}.meta_title`] && (
                                                        <p className="text-xs text-destructive mt-1">{errors[`translations.${locale.key}.meta_title`]}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Meta Description</Label>
                                                    <textarea
                                                        rows={2}
                                                        value={formData.translations[locale.key]?.meta_description || ''}
                                                        onChange={(e) => updateTranslation(locale.key, 'meta_description', e.target.value)}
                                                        placeholder="SEO description (max 160 chars recommended)"
                                                        maxLength={500}
                                                        className={errors[`translations.${locale.key}.meta_description`] ? 'border-destructive w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring' : 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'}
                                                    />
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {formData.translations[locale.key].meta_description.length}/160
                                                    </p>
                                                    {errors[`translations.${locale.key}.meta_description`] && (
                                                        <p className="text-xs text-destructive mt-1">{errors[`translations.${locale.key}.meta_description`]}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Meta Keywords</Label>
                                                    <Input
                                                        value={formData.translations[locale.key]?.meta_keywords || ''}
                                                        onChange={(e) => updateTranslation(locale.key, 'meta_keywords', e.target.value)}
                                                        placeholder="keyword1, keyword2, keyword3"
                                                        maxLength={255}
                                                        className={errors[`translations.${locale.key}.meta_keywords`] ? 'border-destructive' : ''}
                                                    />
                                                    {errors[`translations.${locale.key}.meta_keywords`] && (
                                                        <p className="text-xs text-destructive mt-1">{errors[`translations.${locale.key}.meta_keywords`]}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* General Translation Errors */}
                                            {errors.translations && (
                                                <p className="text-sm text-destructive mt-4">{errors.translations}</p>
                                            )}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Variants */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Variants</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                    <Plus className="mr-1 h-4 w-4" /> Add Variant
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {variants.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No variants yet. Click &quot;Add Variant&quot; to add one.</p>
                                )}
                                {variants.map((variant, index) => (
                                    <div key={index} className="rounded-lg border p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-sm">Variant {index + 1}</h4>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                        {/* Variant image upload */}
                                        <div className="space-y-1">
                                            <Label>
                                                Variant Image <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                {(variant.imagePreview || variant.existingImageUrl) && (
                                                    <img
                                                        src={variant.imagePreview ?? variant.existingImageUrl!}
                                                        alt="Variant"
                                                        className="h-16 w-16 rounded object-cover border"
                                                    />
                                                )}
                                                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm hover:border-primary/50 hover:bg-muted/50 transition-colors">
                                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                                    {variant.existingImageUrl || variant.imagePreview ? 'Replace image' : 'Upload image'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleVariantImageChange(index, e)}
                                                    />
                                                </label>
                                            </div>
                                            {errors.variants_image && !variant.existingImageUrl && !variant.imageFile && (
                                                <p className="text-xs text-destructive">{errors.variants_image}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label>SKU</Label>
                                                <Input
                                                    value={variant.sku}
                                                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                    className={errors[`variants.${index}.sku`] ? 'border-destructive' : ''}
                                                />
                                                {errors[`variants.${index}.sku`] && (
                                                    <p className="text-xs text-destructive">{errors[`variants.${index}.sku`]}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Additional Price (RMB)</Label>
                                                <NumberInput
                                                    value={variant.price}
                                                    onChange={(v) => updateVariant(index, 'price', v)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={variant.is_active}
                                                onCheckedChange={(checked) => updateVariant(index, 'is_active', !!checked)}
                                                id={`variant-active-${index}`}
                                            />
                                            <Label htmlFor={`variant-active-${index}`}>Active</Label>
                                        </div>
                                        {attributeTypes.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Attributes</p>
                                                {errors.variants && (
                                                    <p className="text-sm text-destructive">{errors.variants}</p>
                                                )}
                                                <div className="flex flex-wrap gap-4">
                                                    {attributeTypes.map((at) => (
                                                        <div key={at.id}>
                                                            <p className="text-xs font-medium mb-1">{at.name}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {at.values && at.values.length > 0 ? (
                                                                    at.values.map((v) => (
                                                                        <label key={v.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`variant-${index}-attr-${at.id}`}
                                                                                checked={variant.attribute_value_ids.includes(v.id)}
                                                                                onChange={() => selectAttributeValue(index, at, v.id)}
                                                                                className="accent-primary h-3.5 w-3.5"
                                                                            />
                                                                            {v.value}
                                                                        </label>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">No values defined</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
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
                                        required
                                    />
                                    {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="price">Price (RMB) <span className="text-destructive">*</span></Label>
                                    <NumberInput
                                        id="price"
                                        value={formData.price}
                                        onChange={(v) => setFormData((prev) => ({ ...prev, price: v }))}
                                        required
                                    />
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
                                        <span className="text-xs text-muted-foreground">Price (IDR)</span>
                                        <span className="text-sm font-medium">{formatIdr(priceIdr)}</span>
                                    </div>
                                    {/* Batam */}
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Batam</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xs text-muted-foreground">Delivery (IDR)</span>
                                            <span className="text-sm font-medium">{formatIdr(deliveryChargeBatamIdr)}</span>
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-bold">Total</span>
                                            <span className="font-bold text-sm text-primary">{formatIdr(finalPriceBatamIdr)}</span>
                                        </div>
                                    </div>
                                    {/* Jakarta */}
                                    <div className="space-y-0.5 border-t border-muted pt-1.5">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Jakarta</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xs text-muted-foreground">Delivery (IDR)</span>
                                            <span className="text-sm font-medium">{formatIdr(deliveryChargeJakartaIdr)}</span>
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-bold">Total</span>
                                            <span className="font-bold text-sm text-primary">{formatIdr(finalPriceJakartaIdr)}</span>
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
                                {/* Existing images */}
                                {existingMedia.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Current Images ({existingMedia.length})</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {existingMedia.map((media, index) => (
                                                <div key={media.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                                    <img src={media.url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(media.id)}
                                                        className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 text-destructive-foreground shadow-sm cursor-pointer hover:bg-destructive transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Upload area */}
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                    <p className="text-sm font-medium">Drop images here</p>
                                    <p className="text-xs text-muted-foreground">or click to browse</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>

                                {/* New image previews */}
                                {newImagePreviews.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">New Images ({newImagePreviews.length})</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {newImagePreviews.map((preview, index) => (
                                                <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                                    <img src={preview} alt={`New preview ${index + 1}`} className="h-full w-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(index)}
                                                        className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 text-destructive-foreground shadow-sm cursor-pointer hover:bg-destructive transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {existingMedia.length === 0 && newImageFiles.length === 0 && (
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
