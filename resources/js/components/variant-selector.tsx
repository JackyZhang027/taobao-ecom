import { useState } from 'react';
import type { ProductVariant } from '@/types/product';

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedId: number | null;
    onChange: (id: number | null) => void;
    /** Fired immediately when any option button is clicked, before a full variant match. */
    onOptionSelect?: (groupId: number, optionId: number) => void;
}

export function VariantSelector({ variants, selectedId, onChange, onOptionSelect }: VariantSelectorProps) {
    const groupMap = new Map<number, { id: number; name: string; options: Map<number, string> }>();
    variants.forEach((v) => {
        (v.options ?? []).forEach((o) => {
            if (!groupMap.has(o.group_id)) {
                groupMap.set(o.group_id, { id: o.group_id, name: o.group_name, options: new Map() });
            }
            groupMap.get(o.group_id)!.options.set(o.id, o.value);
        });
    });
    const groups = Array.from(groupMap.values());

    const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>(() => {
        const initial = variants.find((v) => v.id === selectedId);
        if (!initial) return {};
        return Object.fromEntries((initial.options ?? []).map((o) => [o.group_id, o.id]));
    });

    function variantMatchesHypothesis(variant: ProductVariant, hypothesis: Record<number, number>): boolean {
        return Object.entries(hypothesis).every(([gId, oId]) =>
            (variant.options ?? []).some((o) => o.group_id === Number(gId) && o.id === oId),
        );
    }

    function isOptionAvailable(groupId: number, optionId: number): boolean {
        const hypothesis = { ...selectedOptions, [groupId]: optionId };
        return variants.some(
            (v) => v.is_active && variantMatchesHypothesis(v, hypothesis),
        );
    }

    function selectOption(groupId: number, optionId: number) {
        const next = { ...selectedOptions, [groupId]: optionId };
        setSelectedOptions(next);

        // Fire immediately so the gallery can switch to the option's image
        // even before a full variant combination is matched.
        onOptionSelect?.(groupId, optionId);

        if (Object.keys(next).length === groups.length) {
            const matched = variants.find((v) => v.is_active && variantMatchesHypothesis(v, next));
            onChange(matched?.id ?? null);
        } else {
            onChange(null);
        }
    }

    if (groups.length === 0) return null;

    return (
        <div className="space-y-4">
            {groups.map((group) => {
                const options = Array.from(group.options.entries()).map(([id, value]) => ({ id, value }));
                return (
                    <div key={group.id}>
                        <p className="mb-2 text-sm font-medium">{group.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {options.map((opt) => {
                                const available = isOptionAvailable(group.id, opt.id);
                                const isSelected = selectedOptions[group.id] === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        disabled={!available}
                                        onClick={() => available && selectOption(group.id, opt.id)}
                                        className={`rounded border px-3 py-1 text-sm transition-colors
                                            ${isSelected
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'bg-white text-slate-900 border-slate-300 hover:border-blue-600'}
                                            ${!available ? 'cursor-not-allowed opacity-40 line-through' : ''}`.trim()}
                                    >
                                        {opt.value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
