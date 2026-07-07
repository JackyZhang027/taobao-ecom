import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAppearance } from '@/hooks/use-appearance';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export interface SparklineColor {
    light: string;
    dark: string;
}

function hexToRgba(hex: string, alpha: number): string {
    const value = parseInt(hex.slice(1), 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Sparkline({
    data,
    color,
}: {
    data: number[];
    color: SparklineColor;
}) {
    const { resolvedAppearance } = useAppearance();
    const line = color[resolvedAppearance];

    return (
        <div aria-hidden className="h-10 w-full">
            <Line
                data={{
                    labels: data.map((_, i) => i),
                    datasets: [
                        {
                            data,
                            borderColor: line,
                            backgroundColor: hexToRgba(line, 0.1),
                            fill: true,
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.3,
                        },
                    ],
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    events: [],
                    plugins: { tooltip: { enabled: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false, beginAtZero: true },
                    },
                }}
            />
        </div>
    );
}
