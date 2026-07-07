import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Receipt,
    ShoppingCart,
    TriangleAlert,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { RevenueChart } from '@/components/admin/revenue-chart';
import type { TrendPoint } from '@/components/admin/revenue-chart';
import { Sparkline } from '@/components/admin/sparkline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/hooks/use-currency';
import AdminLayout from '@/layouts/admin-layout';

interface PeriodStat {
    current: number;
    previous: number;
}

interface RecentOrder {
    id: number;
    order_number: string | null;
    customer: string | null;
    status: string;
    grand_total_idr: number;
    created_at: string;
}

interface TopProduct {
    product_id: number | null;
    product_name: string;
    units: number;
    revenue: number;
}

interface DashboardProps {
    stats: {
        revenue: PeriodStat;
        orders: PeriodStat;
        customers: PeriodStat;
        aov: PeriodStat;
        pending_orders: number;
    };
    orders_by_status: Record<string, number>;
    revenue_trend: TrendPoint[];
    recent_orders: RecentOrder[];
    top_products: TopProduct[];
}

const STATUS_ORDER = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];

// Meter/dot colors validated for CVD separation and surface contrast (light + dark).
const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-[#ca8a04] dark:bg-[#a16207]',
    confirmed: 'bg-[#3b82f6] dark:bg-[#3b82f6]',
    processing: 'bg-[#6d28d9] dark:bg-[#7c3aed]',
    shipped: 'bg-[#c026d3] dark:bg-[#c026d3]',
    delivered: 'bg-[#16a34a] dark:bg-[#16a34a]',
    cancelled: 'bg-[#dc2626] dark:bg-[#ef4444]',
};

const STATUS_BADGE: Record<string, string> = {
    pending:
        'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900',
    confirmed:
        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900',
    processing:
        'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900',
    shipped:
        'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900',
    delivered:
        'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900',
    cancelled:
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900',
};

const ACCENTS = {
    blue: {
        chip: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
        spark: { light: '#2563eb', dark: '#3b82f6' },
    },
    violet: {
        chip: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
        spark: { light: '#7c3aed', dark: '#8b5cf6' },
    },
    emerald: {
        chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
        spark: { light: '#059669', dark: '#10b981' },
    },
    orange: {
        chip: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
        spark: { light: '#ea580c', dark: '#f97316' },
    },
} as const;

function Delta({ stat }: { stat: PeriodStat }) {
    if (stat.previous <= 0) {
        return (
            <span className="text-xs text-muted-foreground">
                no data for prev. 30 days
            </span>
        );
    }

    const pct = ((stat.current - stat.previous) / stat.previous) * 100;
    const up = pct >= 0;
    const Icon = up ? ArrowUpRight : ArrowDownRight;

    return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${
                    up
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                }`}
            >
                <Icon className="h-3 w-3" />
                {Math.abs(pct).toLocaleString('id-ID', {
                    maximumFractionDigits: 1,
                })}
                %
            </span>
            vs prev. 30 days
        </span>
    );
}

function StatCard({
    title,
    icon,
    value,
    stat,
    spark,
    accent,
}: {
    title: string;
    icon: ReactNode;
    value: string;
    stat: PeriodStat;
    spark: number[];
    accent: keyof typeof ACCENTS;
}) {
    const colors = ACCENTS[accent];

    return (
        <Card className="gap-0 py-5">
            <CardContent className="px-5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p
                            className="mt-1 truncate text-2xl font-bold"
                            title={value}
                        >
                            {value}
                        </p>
                    </div>
                    <div className={`shrink-0 rounded-lg p-2 ${colors.chip}`}>
                        {icon}
                    </div>
                </div>
                <div className="mt-2">
                    <Delta stat={stat} />
                </div>
                <div className="mt-3">
                    <Sparkline data={spark} color={colors.spark} />
                </div>
            </CardContent>
        </Card>
    );
}

function CardHeaderRow({
    title,
    subtitle,
    href,
    linkLabel,
}: {
    title: string;
    subtitle?: string;
    href?: string;
    linkLabel?: string;
}) {
    return (
        <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div>
                <CardTitle className="text-base">{title}</CardTitle>
                {subtitle && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
            {href && (
                <Link
                    href={href}
                    className="text-xs font-medium text-primary hover:underline"
                >
                    {linkLabel ?? 'View all'}
                </Link>
            )}
        </CardHeader>
    );
}

export default function AdminDashboard({
    stats,
    orders_by_status,
    revenue_trend,
    recent_orders,
    top_products,
}: DashboardProps) {
    const { formatIdr } = useCurrency();

    const totalOrders = Object.values(orders_by_status).reduce(
        (a, b) => a + b,
        0,
    );
    const statuses = [
        ...STATUS_ORDER.filter((s) => s in orders_by_status),
        ...Object.keys(orders_by_status).filter(
            (s) => !STATUS_ORDER.includes(s),
        ),
    ];
    const maxUnits = Math.max(...top_products.map((p) => p.units), 1);
    const iconClass = 'h-4 w-4';

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <AdminPageHeader
                title="Dashboard"
                subtitle="Store performance for the last 30 days"
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Revenue"
                    icon={<Banknote className={iconClass} />}
                    value={formatIdr(stats.revenue.current)}
                    stat={stats.revenue}
                    spark={revenue_trend.map((d) => d.revenue)}
                    accent="blue"
                />
                <StatCard
                    title="Orders"
                    icon={<ShoppingCart className={iconClass} />}
                    value={stats.orders.current.toLocaleString('id-ID')}
                    stat={stats.orders}
                    spark={revenue_trend.map((d) => d.orders)}
                    accent="violet"
                />
                <StatCard
                    title="New customers"
                    icon={<Users className={iconClass} />}
                    value={stats.customers.current.toLocaleString('id-ID')}
                    stat={stats.customers}
                    spark={revenue_trend.map((d) => d.customers)}
                    accent="emerald"
                />
                <StatCard
                    title="Avg. order value"
                    icon={<Receipt className={iconClass} />}
                    value={formatIdr(stats.aov.current)}
                    stat={stats.aov}
                    spark={revenue_trend.map((d) =>
                        d.paid_orders > 0 ? d.revenue / d.paid_orders : 0,
                    )}
                    accent="orange"
                />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeaderRow
                        title="Revenue"
                        subtitle="Daily paid-order revenue, last 30 days"
                        href="/admin/orders"
                    />
                    <CardContent>
                        <RevenueChart data={revenue_trend} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeaderRow
                        title="Orders by status"
                        subtitle={`${totalOrders.toLocaleString('id-ID')} orders all time`}
                        href="/admin/orders"
                    />
                    <CardContent className="space-y-4">
                        {statuses.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No orders yet.
                            </p>
                        )}
                        {statuses.map((status) => {
                            const count = orders_by_status[status];
                            return (
                                <div key={status}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 capitalize">
                                            <span
                                                className={`h-2 w-2 rounded-full ${STATUS_COLOR[status] ?? 'bg-muted-foreground'}`}
                                            />
                                            {status}
                                        </span>
                                        <span className="font-medium tabular-nums">
                                            {count.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${STATUS_COLOR[status] ?? 'bg-muted-foreground'}`}
                                            style={{
                                                width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {stats.pending_orders > 0 && (
                            <p className="flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                                <TriangleAlert className="h-3.5 w-3.5 text-[#ca8a04] dark:text-[#eab308]" />
                                {stats.pending_orders.toLocaleString('id-ID')}{' '}
                                pending{' '}
                                {stats.pending_orders === 1
                                    ? 'order'
                                    : 'orders'}{' '}
                                awaiting confirmation
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeaderRow title="Recent orders" href="/admin/orders" />
                    <CardContent>
                        {recent_orders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No orders yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground">
                                            <th className="pb-2 font-medium">
                                                Order
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Customer
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Status
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Total
                                            </th>
                                            <th className="pb-2 pl-4 text-right font-medium">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent_orders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2.5 pr-4">
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        {order.order_number ??
                                                            `#${order.id}`}
                                                    </Link>
                                                </td>
                                                <td className="max-w-[160px] truncate py-2.5 pr-4">
                                                    {order.customer ?? '—'}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[order.status] ?? 'border-gray-200 bg-gray-100 text-gray-600'}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right font-medium tabular-nums">
                                                    {formatIdr(
                                                        order.grand_total_idr,
                                                    )}
                                                </td>
                                                <td className="py-2.5 pl-4 text-right text-xs whitespace-nowrap text-muted-foreground">
                                                    {new Date(
                                                        order.created_at,
                                                    ).toLocaleString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeaderRow
                        title="Top products"
                        subtitle="By units sold, last 30 days"
                        href="/admin/products"
                    />
                    <CardContent className="space-y-3">
                        {top_products.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No sales in this period.
                            </p>
                        )}
                        {top_products.map((product) => (
                            <div
                                key={product.product_id ?? product.product_name}
                            >
                                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                                    <span className="truncate">
                                        {product.product_name}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                        {product.units} pcs ·{' '}
                                        {formatIdr(product.revenue)}
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                                        style={{
                                            width: `${(product.units / maxUnits) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
