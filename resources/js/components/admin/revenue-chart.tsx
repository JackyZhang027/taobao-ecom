import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAppearance } from '@/hooks/use-appearance';
import { useCurrency } from '@/hooks/use-currency';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
);

export interface TrendPoint {
    date: string;
    revenue: number;
    orders: number;
    paid_orders: number;
    customers: number;
}

const THEME = {
    light: {
        line: '#2563eb',
        fill: 'rgba(37, 99, 235, 0.1)',
        grid: '#e4e4e4',
        ticks: '#8a8a8a',
    },
    dark: {
        line: '#3b82f6',
        fill: 'rgba(59, 130, 246, 0.1)',
        grid: '#343434',
        ticks: '#b0b0b0',
    },
};

function compactIdr(value: number): string {
    return (
        'Rp ' +
        new Intl.NumberFormat('id-ID', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value)
    );
}

export function RevenueChart({ data }: { data: TrendPoint[] }) {
    const { formatIdr } = useCurrency();
    const { resolvedAppearance } = useAppearance();
    const theme = THEME[resolvedAppearance];

    return (
        <div className="h-60">
            <Line
                data={{
                    labels: data.map((d) =>
                        new Date(d.date + 'T00:00:00').toLocaleDateString(
                            'id-ID',
                            { day: 'numeric', month: 'short' },
                        ),
                    ),
                    datasets: [
                        {
                            label: 'Revenue',
                            data: data.map((d) => d.revenue),
                            borderColor: theme.line,
                            backgroundColor: theme.fill,
                            fill: true,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            pointHoverBackgroundColor: theme.line,
                            pointHitRadius: 16,
                        },
                    ],
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        tooltip: {
                            displayColors: false,
                            callbacks: {
                                title: (items) =>
                                    new Date(
                                        data[items[0].dataIndex].date +
                                            'T00:00:00',
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    }),
                                label: (item) => formatIdr(item.parsed.y ?? 0),
                                afterLabel: (item) => {
                                    const orders = data[item.dataIndex].orders;
                                    return `${orders} ${orders === 1 ? 'order' : 'orders'}`;
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            border: { color: theme.grid },
                            ticks: {
                                color: theme.ticks,
                                maxTicksLimit: 6,
                                maxRotation: 0,
                            },
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: theme.grid },
                            border: { display: false },
                            ticks: {
                                color: theme.ticks,
                                maxTicksLimit: 4,
                                callback: (value) => compactIdr(Number(value)),
                            },
                        },
                    },
                }}
            />
        </div>
    );
}
