import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '@/types/product';

const generateSlug = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
};

export default function AdminCategoryEdit({ category, categories, image: initialImage }: { category: Category, categories: Category[], image: { id: number, url: string } | null }) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [name, setName] = useState(category.name);
    const [nameId, setNameId] = useState(category.name_id ?? '');
    const [slug, setSlug] = useState(category.slug);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(true); // Don't auto-update slug on edit by default
    const [parentId, setParentId] = useState<string>(category.parent_id ? String(category.parent_id) : 'none');
    const [sortOrder, setSortOrder] = useState(String(category.sort_order ?? 0));

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(initialImage?.url ?? null);
    const [removeImage, setRemoveImage] = useState(false);

    // Auto-generate slug when name changes, unless manually edited
    useEffect(() => {
        if (!slugManuallyEdited) {
            setSlug(generateSlug(name));
        }
    }, [name, slugManuallyEdited]);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value);
        setSlugManuallyEdited(true);
        if (e.target.value === '') {
            setSlugManuallyEdited(false);
            setSlug(generateSlug(name));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setRemoveImage(false);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
        setRemoveImage(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const payload: Record<string, any> = {
            _method: 'PUT',
            name,
            name_id: nameId,
            slug,
            parent_id: parentId === 'none' ? null : Number(parentId),
            sort_order: sortOrder,
            remove_image: removeImage,
        };

        if (image) {
            payload.image = image;
        }

        router.post(`/admin/categories/${category.id}`, payload, {
            onSuccess: () => toast.success('Category updated successfully'),
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
                toast.error('Failed to update category');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit Category: ${category.name}`} />
            <form onSubmit={submit}>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Edit Category</h1>
                        <p className="text-sm text-muted-foreground mt-1">Update category details</p>
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
                                <CardTitle>Category Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Name (EN) <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                
                                <div className="space-y-1">
                                    <Label htmlFor="name_id">Name (ID)</Label>
                                    <Input
                                        id="name_id"
                                        value={nameId}
                                        onChange={(e) => setNameId(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={handleSlugChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">The URL-friendly version of the name.</p>
                                    {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="parent_id">Parent Category</Label>
                                    <Select value={parentId} onValueChange={setParentId}>
                                        <SelectTrigger id="parent_id">
                                            <SelectValue placeholder="Select parent category (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Root Category)</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={String(cat.id)}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.parent_id && <p className="text-sm text-destructive">{errors.parent_id}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Image</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {imagePreview ? (
                                    <div className="space-y-3">
                                        <div className="aspect-square w-full relative rounded-md overflow-hidden border">
                                            <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('image')?.click()}>
                                                Change
                                            </Button>
                                            <Button type="button" variant="destructive" onClick={handleRemoveImage}>
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md text-center hover:bg-muted/50 cursor-pointer" onClick={() => document.getElementById('image')?.click()}>
                                        <div className="text-muted-foreground mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                        </div>
                                        <p className="text-sm font-medium">Click to upload image</p>
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="image"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
