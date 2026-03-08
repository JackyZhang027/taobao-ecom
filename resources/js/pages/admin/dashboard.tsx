import { Head } from '@inertiajs/react';
import { useCurrency } from '@/hooks/use-currency';
import AdminLayout from '@/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

interface DashboardProps {
    stats: {
        orders_by_status: Record<string, number>;
        total_revenue: number;
        new_customers: number;
    };
}

export default function AdminDashboard({ stats }: DashboardProps) {
    const { formatIdr } = useCurrency();
    const totalOrders = Object.values(stats.orders_by_status).reduce((a, b) => a + b, 0);
    const pendingOrders = stats.orders_by_status['pending'] ?? 0;

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">Overview of your store performance</p>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatIdr(stats.total_revenue)}</p>
                        <CardDescription>All time revenue</CardDescription>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pendingOrders}</p>
                        <CardDescription>Awaiting confirmation</CardDescription>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats.new_customers}</p>
                        <CardDescription>Last 30 days</CardDescription>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalOrders}</p>
                        <CardDescription>All time orders</CardDescription>
                    </CardContent>
                </Card>
            </div>
            {Object.entries(stats.orders_by_status).length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                    {Object.entries(stats.orders_by_status).map(([status, count]) => (
                        <Card key={status}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium capitalize">{status} Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xl font-bold">{count}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
