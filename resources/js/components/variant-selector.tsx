import { useCurrency } from '@/hooks/use-currency';
import type { AttributeType, ProductVariant } from '@/types/product';

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedId: number | null;
    onChange: (id: number) => void;
}

export function VariantSelector({ variants, selectedId, onChange }: VariantSelectorProps) {
    const { formatIdr } = useCurrency();

    // Collect all attribute types present across variants
    const attributeTypeMap = new Map<number, AttributeType>();
    variants.forEach((v) => {
        (v.attributes ?? []).forEach((av) => {
            if (av.type && !attributeTypeMap.has(av.type.id)) {
                attributeTypeMap.set(av.type.id, av.type);
            }
        });
    });
    const attributeTypes = Array.from(attributeTypeMap.values());

    const selectedVariant = variants.find((v) => v.id === selectedId);

    if (attributeTypes.length === 0) {
        // Flat pill list
        return (
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                        <button
                            key={v.id}
                            disabled={!v.is_active}
                            onClick={() => onChange(v.id)}
                            className={`rounded border px-3 py-1 text-sm transition-colors
                                ${selectedId === v.id
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-white text-slate-900 border-slate-300 hover:border-primary'}
                                ${!v.is_active ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                            {v.sku}
                        </button>
                    ))}
                </div>
                {selectedVariant?.price_idr != null && (
                    <p className="font-bold text-primary">{formatIdr(selectedVariant.price_idr)}</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {attributeTypes.map((atType) => {
                // Collect unique values for this attribute type
                const valueMap = new Map<number, { id: number; value: string }>();
                variants.forEach((v) => {
                    (v.attributes ?? [])
                        .filter((av) => av.type?.id === atType.id)
                        .forEach((av) => valueMap.set(av.id, { id: av.id, value: av.value }));
                });
                const values = Array.from(valueMap.values());

                return (
                    <div key={atType.id}>
                        <p className="mb-2 text-sm font-medium">{atType.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {values.map((av) => {
                                // Is there an active variant that includes this value?
                                const matchingVariant = variants.find(
                                    (v) => v.is_active && (v.attributes ?? []).some((a) => a.id === av.id),
                                );
                                const isSelected = (selectedVariant?.attributes ?? []).some((a) => a.id === av.id);

                                return (
                                    <button
                                        key={av.id}
                                        disabled={!matchingVariant}
                                        onClick={() => matchingVariant && onChange(matchingVariant.id)}
                                        className={`rounded border px-3 py-1 text-sm transition-colors
                                            ${isSelected
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'bg-white text-slate-900 border-slate-300 hover:border-primary'}
                                            ${!matchingVariant ? 'cursor-not-allowed opacity-40' : ''}`.trim()}
                                    >
                                        {av.value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            {selectedVariant?.price_idr != null && (
                <p className="font-bold text-primary text-lg">{formatIdr(selectedVariant.price_idr)}</p>
            )}
        </div>
    );
}
