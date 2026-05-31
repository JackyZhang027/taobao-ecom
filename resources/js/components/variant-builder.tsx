import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import type { ProductVariant, VariantGroup, VariantOption } from '@/types/product';

// Internal builder types (client-side state, not DB types)
export interface BuilderOption {
    _key: string;
    id?: number;
    value: string;
    imageFile?: File | null;
    imagePreview?: string | null;
    existingImageUrl?: string | null;
}

export interface BuilderGroup {
    _key: string;
    id?: number;
    name: string;
    has_images: boolean;
    options: BuilderOption[];
}

export interface VariantRow {
    combo_key: string;
    variant_id?: number;
    option_labels: string[];
    price: string;
    sku: string;
    is_active: boolean;
}

interface VariantBuilderProps {
    initialGroups: VariantGroup[];
    initialVariants: ProductVariant[];
    productSlug: string;
    onChange: (groups: BuilderGroup[], rows: VariantRow[]) => void;
}

let keyCounter = 0;
function newKey(): string {
    return `_k${++keyCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

function autoSku(slug: string, options: string[]): string {
    const base = slug.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const suffix = options.map((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');
    return `${base}-${suffix}`.slice(0, 190);
}

function cartesian(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [];
    return arrays.reduce<string[][]>(
        (acc, arr) => acc.flatMap((x) => arr.map((y) => [...x, y])),
        [[]]
    );
}

function buildComboKey(optionKeys: string[]): string {
    return [...optionKeys].sort().join('|');
}

function emptyOption(): BuilderOption {
    return { _key: newKey(), value: '', imageFile: null, imagePreview: null, existingImageUrl: null };
}

/** Returns true if any image-group option is missing an image. */
export function hasMissingOptionImages(groups: BuilderGroup[]): boolean {
    return groups.some(
        (g) =>
            g.has_images &&
            g.options.some(
                (o) => o.value.trim() && !o.imageFile && !o.imagePreview && !o.existingImageUrl
            )
    );
}

export default function VariantBuilder({
    initialGroups,
    initialVariants,
    productSlug,
    onChange,
}: VariantBuilderProps) {
    const [groups, setGroups] = useState<BuilderGroup[]>(() =>
        initialGroups.map((g) => ({
            _key: newKey(),
            id: g.id,
            name: g.name,
            has_images: g.has_images ?? false,
            options: (g.options ?? []).map((o) => ({
                _key: newKey(),
                id: o.id,
                value: o.value,
                imageFile: null,
                imagePreview: null,
                existingImageUrl: (o as VariantOption & { image_url?: string | null }).image_url ?? null,
            })),
        }))
    );

    const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
    const [bulkPrice, setBulkPrice] = useState('');

    const initialVariantMapRef = useRef<Map<string, ProductVariant>>(
        new Map(
            initialVariants.map((v) => {
                const key = (v.options ?? [])
                    .map((o) => o.id)
                    .sort((a, b) => a - b)
                    .join('|');
                return [key, v];
            })
        )
    );

    const recompute = useCallback(
        (currentGroups: BuilderGroup[], prevRows: VariantRow[]) => {
            const validGroups = currentGroups.filter(
                (g) => g.name.trim() && g.options.some((o) => o.value.trim())
            );

            if (validGroups.length === 0) {
                setVariantRows([]);
                return [];
            }

            const optionArrays = validGroups.map((g) =>
                g.options.filter((o) => o.value.trim()).map((o) => o._key)
            );
            const combinations = cartesian(optionArrays);
            const prevMap = new Map(prevRows.map((r) => [r.combo_key, r]));

            const newRows: VariantRow[] = combinations.map((combo) => {
                const comboKey = buildComboKey(combo);

                const optionLabels = combo.map((optKey) => {
                    for (const g of validGroups) {
                        const found = g.options.find((o) => o._key === optKey);
                        if (found) return found.value;
                    }
                    return '';
                });

                const optionDbIds = combo.map((optKey) => {
                    for (const g of validGroups) {
                        const found = g.options.find((o) => o._key === optKey);
                        if (found?.id) return found.id;
                    }
                    return null;
                });

                const hasAllDbIds = optionDbIds.every((id) => id !== null);
                const dbKey = hasAllDbIds
                    ? (optionDbIds as number[]).slice().sort((a, b) => a - b).join('|')
                    : null;

                const dbVariant = dbKey ? initialVariantMapRef.current.get(dbKey) : null;

                if (prevMap.has(comboKey)) {
                    return { ...prevMap.get(comboKey)!, option_labels: optionLabels };
                }

                if (dbVariant) {
                    return {
                        combo_key: comboKey,
                        variant_id: dbVariant.id,
                        option_labels: optionLabels,
                        price: String(dbVariant.price ?? 0),
                        sku: dbVariant.sku ?? autoSku(productSlug, optionLabels),
                        is_active: dbVariant.is_active ?? true,
                    };
                }

                return {
                    combo_key: comboKey,
                    variant_id: undefined,
                    option_labels: optionLabels,
                    price: '0',
                    sku: autoSku(productSlug, optionLabels),
                    is_active: true,
                };
            });

            setVariantRows(newRows);
            return newRows;
        },
        [productSlug]
    );

    useEffect(() => {
        recompute(groups, []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        onChange(groups, variantRows);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groups, variantRows]);

    const updateGroupsAndRecompute = (newGroups: BuilderGroup[]) => {
        setGroups(newGroups);
        setVariantRows((prev) => recompute(newGroups, prev));
    };

    // ── Group management ──────────────────────────────────────────────

    const addGroup = () => {
        const newGroups = [
            ...groups,
            { _key: newKey(), name: '', has_images: false, options: [emptyOption()] },
        ];
        updateGroupsAndRecompute(newGroups);
    };

    const removeGroup = (gKey: string) => {
        updateGroupsAndRecompute(groups.filter((g) => g._key !== gKey));
    };

    const updateGroupName = (gKey: string, name: string) => {
        updateGroupsAndRecompute(groups.map((g) => (g._key === gKey ? { ...g, name } : g)));
    };

    // Only one group can have images at a time (Shopee rule)
    const toggleGroupImages = (gKey: string) => {
        setGroups((prev) =>
            prev.map((g) => ({
                ...g,
                has_images: g._key === gKey ? !g.has_images : false,
            }))
        );
    };

    const addOption = (gKey: string) => {
        updateGroupsAndRecompute(
            groups.map((g) =>
                g._key === gKey ? { ...g, options: [...g.options, emptyOption()] } : g
            )
        );
    };

    const removeOption = (gKey: string, oKey: string) => {
        updateGroupsAndRecompute(
            groups.map((g) =>
                g._key === gKey ? { ...g, options: g.options.filter((o) => o._key !== oKey) } : g
            )
        );
    };

    const updateOptionValue = (gKey: string, oKey: string, value: string) => {
        updateGroupsAndRecompute(
            groups.map((g) =>
                g._key === gKey
                    ? { ...g, options: g.options.map((o) => (o._key === oKey ? { ...o, value } : o)) }
                    : g
            )
        );
    };

    const handleOptionImage = (gKey: string, oKey: string, file: File) => {
        const preview = URL.createObjectURL(file);
        setGroups((prev) =>
            prev.map((g) =>
                g._key === gKey
                    ? {
                          ...g,
                          options: g.options.map((o) =>
                              o._key === oKey
                                  ? { ...o, imageFile: file, imagePreview: preview, existingImageUrl: null }
                                  : o
                          ),
                      }
                    : g
            )
        );
    };

    // ── Variant row management ────────────────────────────────────────

    const updateRow = (comboKey: string, patch: Partial<VariantRow>) => {
        setVariantRows((prev) =>
            prev.map((r) => (r.combo_key === comboKey ? { ...r, ...patch } : r))
        );
    };

    const applyBulkPrice = () => {
        if (bulkPrice === '') return;
        setVariantRows((prev) => prev.map((r) => ({ ...r, price: bulkPrice })));
        setBulkPrice('');
    };

    // ── Render ────────────────────────────────────────────────────────

    const groupColumns = groups.filter(
        (g) => g.name.trim() && g.options.some((o) => o.value.trim())
    );

    return (
        <div className="space-y-6">
            {/* Groups section */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Variant Groups</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                        + Add Group
                    </Button>
                </div>

                {groups.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No variant groups yet. Click "Add Group" to start (e.g., Color, Size).
                    </p>
                )}

                {groups.map((group) => (
                    <div key={group._key} className="rounded-md border bg-muted/30 p-3 space-y-3">
                        {/* Group header row */}
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Group name (e.g. Color)"
                                value={group.name}
                                onChange={(e) => updateGroupName(group._key, e.target.value)}
                                className="h-8 flex-1"
                            />
                            {/* Shopee-style: only one group may have images */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-muted-foreground whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={group.has_images}
                                    onChange={() => toggleGroupImages(group._key)}
                                    className="size-3.5 cursor-pointer rounded border-gray-300"
                                />
                                Images
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive"
                                onClick={() => removeGroup(group._key)}
                            >
                                Remove
                            </Button>
                        </div>

                        {/* Options */}
                        <div className="flex flex-wrap items-start gap-2">
                            {group.options.map((opt) => (
                                <div key={opt._key} className="flex flex-col items-center gap-1">
                                    {/* Option chip */}
                                    <div className="flex items-center gap-1 rounded-full border bg-background px-2 py-1">
                                        <input
                                            type="text"
                                            placeholder="Option"
                                            value={opt.value}
                                            onChange={(e) =>
                                                updateOptionValue(group._key, opt._key, e.target.value)
                                            }
                                            className="h-5 w-20 border-none bg-transparent text-xs outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOption(group._key, opt._key)}
                                            className="text-muted-foreground hover:text-destructive text-xs leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Option image — required when group.has_images */}
                                    {group.has_images && (
                                        <OptionImageCell
                                            option={opt}
                                            required={!!opt.value.trim()}
                                            onFileChange={(file) =>
                                                handleOptionImage(group._key, opt._key, file)
                                            }
                                        />
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs self-start"
                                onClick={() => addOption(group._key)}
                            >
                                + Add Option
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Generated variant matrix */}
            {variantRows.length > 0 && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-sm font-semibold">
                            Generated Variants ({variantRows.length})
                        </h3>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    Set all prices (¥):
                                </span>
                                <NumberInput
                                    value={bulkPrice}
                                    onChange={setBulkPrice}
                                    className="h-7 w-24 text-xs"
                                    placeholder="0.00"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2"
                                    onClick={applyBulkPrice}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b">
                                    {groupColumns.map((g) => (
                                        <th
                                            key={g._key}
                                            className="px-2 py-2 text-left font-medium text-muted-foreground"
                                        >
                                            {g.name || 'Group'}
                                        </th>
                                    ))}
                                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                                        SKU
                                    </th>
                                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                                        Price (¥)
                                    </th>
                                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                                        Active
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {variantRows.map((row) => (
                                    <tr key={row.combo_key} className="border-b last:border-0">
                                        {row.option_labels.map((label, i) => (
                                            <td
                                                key={i}
                                                className="px-2 py-1.5 font-medium whitespace-nowrap"
                                            >
                                                {label}
                                            </td>
                                        ))}
                                        <td className="px-2 py-1.5">
                                            <Input
                                                value={row.sku}
                                                onChange={(e) =>
                                                    updateRow(row.combo_key, { sku: e.target.value })
                                                }
                                                className="h-7 w-100 text-xs"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <NumberInput
                                                value={row.price}
                                                onChange={(val) =>
                                                    updateRow(row.combo_key, { price: val })
                                                }
                                                className="h-7 w-24 text-xs"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input
                                                type="checkbox"
                                                checked={row.is_active}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    updateRow(row.combo_key, { is_active: e.target.checked })
                                                }
                                                className="size-4 cursor-pointer rounded border-gray-300"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function OptionImageCell({
    option,
    required,
    onFileChange,
}: {
    option: BuilderOption;
    required: boolean;
    onFileChange: (file: File) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const displaySrc = option.imagePreview ?? option.existingImageUrl ?? null;
    const missing = required && !displaySrc;

    return (
        <div className="flex flex-col items-center gap-0.5">
            {displaySrc ? (
                <img
                    src={displaySrc}
                    alt=""
                    className="h-12 w-12 rounded object-cover border"
                />
            ) : (
                <div
                    className={`h-12 w-12 rounded border border-dashed flex items-center justify-center text-[10px] text-center leading-tight ${
                        missing ? 'border-red-400 text-red-400' : 'border-slate-300 text-slate-400'
                    }`}
                >
                    {missing ? (
                        <>Required</>
                    ) : (
                        <>No<br />image</>
                    )}
                </div>
            )}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`text-[10px] hover:underline whitespace-nowrap ${missing ? 'text-red-500 font-medium' : 'text-blue-600'}`}
            >
                {displaySrc ? 'Change' : 'Upload'}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileChange(file);
                    e.target.value = '';
                }}
            />
        </div>
    );
}
