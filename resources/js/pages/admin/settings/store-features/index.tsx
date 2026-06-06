import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FEATURE_ICONS } from '@/lib/feature-icons';
import type { StoreFeature } from '@/types/settings';

interface Props {
    features: StoreFeature[];
}

export default function AdminStoreFeaturesIndex({ features }: Props) {
    return (
        <AdminLayout breadcrumbs={[
            { title: 'Settings', href: '/admin/settings/shop' },
            { title: 'Store Features', href: '' },
        ]}>
            <Head title="Store Features" />

            <AdminPageHeader
                title="Store Features"
                subtitle="Manage the four trust/benefit badges shown on the home page. Maximum 4 features."
            />

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-14">Icon</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Description</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((feature) => {
                                const IconComponent = FEATURE_ICONS[feature.icon];
                                return (
                                    <tr key={feature.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground">{feature.sort_order}</td>
                                        <td className="px-4 py-3">
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                                {IconComponent ? (
                                                    <IconComponent className="h-5 w-5 text-slate-700" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">{feature.icon}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{feature.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{feature.description}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={feature.is_active ? 'default' : 'secondary'}>
                                                {feature.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/settings/store-features/${feature.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
