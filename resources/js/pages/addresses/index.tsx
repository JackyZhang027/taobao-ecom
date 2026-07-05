import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AddressCard from '@/components/address-card';
import AddressForm from '@/components/address-form';
import { Button } from '@/components/ui/button';
import CustomerLayout from '@/layouts/customer-layout';
import type { Address } from '@/types/address';

interface AddressesPageProps {
    addresses: Address[];
}

export default function AddressesIndex({ addresses }: AddressesPageProps) {
    const { t } = useTranslation();
    const [showAddForm, setShowAddForm] = useState(addresses.length === 0);
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleDelete = (address: Address) => {
        if (!window.confirm(t('addresses.delete_confirm'))) return;

        router.delete(`/addresses/${address.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success(t('common.delete')),
        });
    };

    const handleSetDefault = (address: Address) => {
        router.patch(
            `/addresses/${address.id}/default`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <CustomerLayout>
            <Head title={t('addresses.title')} />

            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">{t('addresses.title')}</h1>
                    <Link href="/profile" className="text-sm text-blue-600 hover:underline">
                        {t('addresses.back_to_profile')}
                    </Link>
                </div>

                {addresses.length === 0 && !showAddForm && (
                    <p className="text-sm text-slate-500">{t('addresses.empty')}</p>
                )}

                <div className="space-y-4">
                    {addresses.map((address) =>
                        editingId === address.id ? (
                            <AddressForm key={address.id} address={address} onCancel={() => setEditingId(null)} />
                        ) : (
                            <AddressCard
                                key={address.id}
                                address={address}
                                onEdit={() => setEditingId(address.id)}
                                onDelete={() => handleDelete(address)}
                                onSetDefault={() => handleSetDefault(address)}
                            />
                        ),
                    )}
                </div>

                {showAddForm ? (
                    <AddressForm onCancel={() => setShowAddForm(false)} />
                ) : (
                    <Button type="button" onClick={() => setShowAddForm(true)}>
                        {t('addresses.add_new')}
                    </Button>
                )}
            </div>
        </CustomerLayout>
    );
}
