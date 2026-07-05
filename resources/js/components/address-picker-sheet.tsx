import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddressCard from '@/components/address-card';
import AddressForm from '@/components/address-form';
import { Button } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Address } from '@/types/address';

interface AddressPickerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    addresses: Address[];
    selectedId: string;
    onSelect: (address: Address) => void;
    /** Open directly into the add-address form (used for the zero-addresses empty state). */
    startInForm?: boolean;
}

export default function AddressPickerSheet({ open, onOpenChange, addresses, selectedId, onSelect, startInForm = false }: AddressPickerSheetProps) {
    const { t } = useTranslation();
    const [view, setView] = useState<'list' | 'form'>(startInForm ? 'form' : 'list');
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const handleOpenChange = (next: boolean) => {
        if (next) {
            setView(startInForm ? 'form' : 'list');
            setEditingAddress(null);
        }
        onOpenChange(next);
    };

    const handleDelete = (address: Address) => {
        if (!window.confirm(t('addresses.delete_confirm'))) return;
        router.delete(`/addresses/${address.id}`, { preserveScroll: true, preserveState: true });
    };

    const handleSetDefault = (address: Address) => {
        router.patch(`/addresses/${address.id}/default`, {}, { preserveScroll: true, preserveState: true });
    };

    const handleFormSuccess = (freshAddresses: Address[]) => {
        const previousIds = new Set(addresses.map((a) => a.id));
        const picked = editingAddress
            ? (freshAddresses.find((a) => a.id === editingAddress.id) ?? editingAddress)
            : (freshAddresses.find((a) => !previousIds.has(a.id)) ?? freshAddresses[freshAddresses.length - 1]);

        if (picked) onSelect(picked);
        setView('list');
        setEditingAddress(null);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="border-b">
                    <SheetTitle>{view === 'form' ? t('addresses.add_new') : t('checkout.select_address')}</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4">
                    {view === 'form' ? (
                        <AddressForm
                            address={editingAddress ?? undefined}
                            onCancel={() => {
                                if (addresses.length === 0) {
                                    onOpenChange(false);
                                } else {
                                    setView('list');
                                    setEditingAddress(null);
                                }
                            }}
                            onSuccess={handleFormSuccess}
                        />
                    ) : (
                        <div className="space-y-3">
                            <RadioGroup
                                value={selectedId}
                                onValueChange={(id) => {
                                    const address = addresses.find((a) => String(a.id) === id);
                                    if (address) {
                                        onSelect(address);
                                        onOpenChange(false);
                                    }
                                }}
                                className="space-y-3"
                            >
                                {addresses.map((address) => (
                                    <AddressCard
                                        key={address.id}
                                        address={address}
                                        selectable
                                        selected={selectedId === String(address.id)}
                                        onEdit={() => {
                                            setEditingAddress(address);
                                            setView('form');
                                        }}
                                        onDelete={() => handleDelete(address)}
                                        onSetDefault={() => handleSetDefault(address)}
                                    />
                                ))}
                            </RadioGroup>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setEditingAddress(null);
                                    setView('form');
                                }}
                            >
                                {t('addresses.add_new')}
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
