import { Head, useForm } from '@inertiajs/react';
import { useCurrency } from '@/hooks/use-currency';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Order } from '@/types/order';

interface OrderShowProps {
    order: Order & { user?: { id: number; name: string; email: string } };
}

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const statusVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    pending: 'secondary',
    confirmed: 'default',
    processing: 'default',
    shipped: 'default',
    delivered: 'default',
    cancelled: 'destructive',
};

export default function AdminOrderShow({ order }: OrderShowProps) {
    const { formatIdr } = useCurrency();
    const { data, setData, patch, processing } = useForm({ status: order.status });

    return (
        <AdminLayout>
            <Head title={`Order #${order.id}`} />
            <div className="mb-6 flex items-center gap-3">
                <h1 className="text-2xl font-bold">Order #{order.id}</h1>
                <Badge variant={statusVariant[order.status] ?? 'secondary'} className="capitalize">
                    {order.status}
                </Badge>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Lines</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Product</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.lines?.map((line) => (
                                        <tr key={line.id} className="border-b">
                                            <td className="px-4 py-3">
                                                <p>{line.product_name}</p>
                                                {line.variant_name && (
                                                    <p className="text-xs text-muted-foreground">{line.variant_name}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatIdr(line.unit_price_idr)}</td>
                                            <td className="px-4 py-3 text-right">{line.quantity}</td>
                                            <td className="px-4 py-3 text-right">{formatIdr(line.subtotal_idr)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t bg-muted/20">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-right text-sm">
                                            Shipping
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm">{formatIdr(order.shipping_idr)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-right font-bold">
                                            Total
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold">{formatIdr(order.grand_total_idr)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium">{order.user?.name}</p>
                                <p className="text-muted-foreground">{order.user?.email}</p>
                            </div>
                            <hr />
                            <div>
                                <p className="font-medium mb-1">Shipping Address</p>
                                <p>{order.recipient_name}</p>
                                <p className="text-muted-foreground">{order.recipient_phone}</p>
                                <p className="text-muted-foreground">{order.shipping_address}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Update Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Select value={data.status} onValueChange={(v) => setData('status', v as typeof data.status)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => (
                                        <SelectItem key={s} value={s} className="capitalize">
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                className="w-full"
                                onClick={() => patch(`/admin/orders/${order.id}/status`, {
                                    onSuccess: () => toast.success('Order status updated successfully'),
                                    onError: () => toast.error('Failed to update order status'),
                                })}
                                disabled={processing}
                            >
                                Update Status
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
