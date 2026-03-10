import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const fmtBlur = (raw: string) =>
    new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        parseFloat(raw) || 0,
    );

// Format integer part with commas, preserve decimal suffix as-is while typing
function toDisplay(raw: string): string {
    if (!raw) return '';
    const dotIndex = raw.indexOf('.');
    const intPart = dotIndex >= 0 ? raw.slice(0, dotIndex) : raw;
    const decPart = dotIndex >= 0 ? raw.slice(dotIndex) : '';
    const formatted = parseInt(intPart || '0', 10).toLocaleString('en');
    return formatted + decPart;
}

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
    value: string;
    onChange: (value: string) => void;
}

export function NumberInput({ value, onChange, className, onFocus, onBlur, ...props }: NumberInputProps) {
    const [focused, setFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '');
        if (!/^\d*\.?\d*$/.test(raw)) return;
        onChange(raw);
    };

    // Empty value: show '' so placeholder is visible; otherwise format
    const displayValue = focused ? toDisplay(value) : (value === '' ? '' : fmtBlur(value));

    return (
        <Input
            {...props}
            type="text"
            inputMode="decimal"
            value={displayValue}
            className={cn('text-right', className)}
            onFocus={(e) => {
                setFocused(true);
                setTimeout(() => e.target.select(), 0);
                onFocus?.(e);
            }}
            onBlur={(e) => {
                setFocused(false);
                const raw = e.target.value.replace(/,/g, '');
                // Preserve empty string; normalize non-empty to plain number string
                if (raw !== '') {
                    onChange(String(parseFloat(raw) || 0));
                }
                onBlur?.(e);
            }}
            onChange={handleChange}
        />
    );
}
