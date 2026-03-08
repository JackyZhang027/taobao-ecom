import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Trash2, Plus, Upload, X, ImageIcon } from 'lucide-react';
import type { AttributeType, Category } from '@/types/product';

interface VariantRow {
    sku: string;
    price: string;
    is_active: boolean;
    sort_order: string;
    attribute_value_ids: number[];
}

interface TranslationData {
    name: string;
    description: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
}

interface CreateProps {
    categories: Category[];
    attributeTypes: AttributeType[];
    exchangeRate: number;
}

const LOCALES = [
    { key: 'en', label: 'English', flag: 'EN' },
    { key: 'id', label: 'Bahasa Indonesia', flag: 'ID' },
] as const;

const formatRmb = (amount: number) => `¥${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatIdr = (amount: number) => `Rp ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminProductCreate({ categories, attributeTypes, exchangeRate }: CreateProps) {
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        slug: '',
        price: '0',
        delivery_charge: '0',
        is_active: true,
        sort_order: '0',
        categories: [] as number[],
        translations: {
            en: { name: '', description: '', meta_title: '', meta_description: '', meta_keywords: '' },
            id: { name: '', description: '', meta_title: '', meta_description: '', meta_keywords: '' },
        } as Record<string, TranslationData>,
    });

    // Computed final price
    const priceRmb = parseFloat(formData.price) || 0;
    const deliveryChargeRmb = parseFloat(formData.delivery_charge) || 0;
    const finalPriceRmb = priceRmb + deliveryChargeRmb;
    const finalPriceIdr = finalPriceRmb * (exchangeRate || 0);

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
            { sku: '', price: '0', is_active: true, sort_order: '0', attribute_value_ids: [] },
        ]);
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

        const fd = new FormData();
        fd.append('slug', formData.slug);
        fd.append('price', formData.price);
        fd.append('delivery_charge', formData.delivery_charge);
        fd.append('is_active', formData.is_active ? '1' : '0');
        fd.append('sort_order', formData.sort_order);

        formData.categories.forEach((catId) => fd.append('categories[]', String(catId)));

        Object.entries(formData.translations).forEach(([locale, trans]) => {
            Object.entries(trans).forEach(([field, value]) => {
                fd.append(`translations[${locale}][${field}]`, value);
            });
        });

        variants.forEach((variant, vi) => {
            Object.entries(variant).forEach(([field, value]) => {
                if (field === 'attribute_value_ids') {
                    (value as number[]).forEach((id) => fd.append(`variants[${vi}][attribute_value_ids][]`, String(id)));
                } else if (field === 'is_active') {
                    fd.append(`variants[${vi}][${field}]`, value ? '1' : '0');
                } else {
                    fd.append(`variants[${vi}][${field}]`, String(value));
                }
            });
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
                {/* Page Header with buttons */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Create Product</h1>
                        <p className="text-sm text-muted-foreground mt-1">Add a new product to your catalog</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Product'}
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

                                            {/* SEO Meta Section */}
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
                                                    {errors[`translations.${locale.key}.meta_title`] && (
                                                        <p className="text-xs text-destructive">{errors[`translations.${locale.key}.meta_title`]}</p>
                                                    )}
                                                    {errors[`translations.${locale.key}.meta_description`] && (
                                                        <p className="text-xs text-destructive">{errors[`translations.${locale.key}.meta_description`]}</p>
                                                    )}
                                                    {errors[`translations.${locale.key}.meta_keywords`] && (
                                                        <p className="text-xs text-destructive">{errors[`translations.${locale.key}.meta_keywords`]}</p>
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
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={variant.price}
                                                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
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
                                        placeholder="auto-generated-from-name"
                                        required
                                    />
                                    {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="price">Price (RMB)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="delivery_charge">Delivery Charge (RMB)</Label>
                                    <Input
                                        id="delivery_charge"
                                        type="number"
                                        step="0.01"
                                        value={formData.delivery_charge}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, delivery_charge: e.target.value }))}
                                    />
                                </div>

                                {/* Final Price Display */}
                                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Final Price</p>
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                            Rate: 1 RMB = {exchangeRate.toLocaleString('en-US')} IDR
                                        </span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-sm text-muted-foreground">Price + Delivery</span>
                                        <span className="font-semibold text-sm">{formatRmb(finalPriceRmb)}</span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-sm text-muted-foreground">≈ IDR</span>
                                        <span className="font-semibold text-sm text-primary">{formatIdr(finalPriceIdr)}</span>
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
