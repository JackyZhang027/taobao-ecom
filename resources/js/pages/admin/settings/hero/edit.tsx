import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HeroSlide } from '@/types/settings';

export default function AdminHeroSlideEdit({ heroSlide, imageUrl }: { heroSlide: HeroSlide, imageUrl: string | null }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: heroSlide.title || '',
        subtitle: heroSlide.subtitle || '',
        description: heroSlide.description || '',
        cta_text: heroSlide.cta_text || '',
        cta_link: heroSlide.cta_link || '',
        sort_order: String(heroSlide.sort_order ?? 0),
        is_active: heroSlide.is_active ?? true,
        image: null as File | null,
        remove_image: false,
    });
    
    const [imagePreview, setImagePreview] = useState<string | null>(imageUrl);
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev: any) => ({
                ...prev,
                image: file,
                remove_image: false
            }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setData((prev: any) => ({
            ...prev,
            image: null,
            remove_image: true
        }));
        setImagePreview(null);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(`/admin/settings/hero/${heroSlide.id}`, {
            forceFormData: true,
            onSuccess: () => toast.success('Hero slide updated successfully'),
            onError: () => toast.error('Failed to update hero slide'),
        });
    };

    return (
        <AdminLayout breadcrumbs={[
            { title: 'Settings', href: '/admin/settings/shop' },
            { title: 'Hero Slides', href: '/admin/settings/hero' },
            { title: 'Edit', href: '' }
        ]}>
            <Head title="Edit Hero Slide" />

            <form onSubmit={submit}>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Edit Hero Slide</h1>
                        <p className="text-sm text-muted-foreground mt-1">Modify an existing banner.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
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
                                <CardTitle>Slide Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e: any) => setData('title', e.target.value)}
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="subtitle">Subtitle</Label>
                                    <Input
                                        id="subtitle"
                                        value={data.subtitle}
                                        onChange={(e: any) => setData('subtitle', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e: any) => setData('description', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="cta_text">Button Text</Label>
                                        <Input
                                            id="cta_text"
                                            value={data.cta_text}
                                            onChange={(e: any) => setData('cta_text', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="cta_link">Button Link</Label>
                                        <Input
                                            id="cta_link"
                                            value={data.cta_link}
                                            onChange={(e: any) => setData('cta_link', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="sort_order">Sort Order</Label>
                                        <Input
                                            id="sort_order"
                                            type="number"
                                            value={data.sort_order}
                                            onChange={(e: any) => setData('sort_order', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col justify-end pb-2">
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
                                <CardTitle>Background Image</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {imagePreview ? (
                                    <div className="space-y-3">
                                        <div className="aspect-[21/9] w-full relative rounded-md overflow-hidden border">
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
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP recommended</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="image"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
