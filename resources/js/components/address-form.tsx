import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Address } from '@/types/address';

export const cityProvinceMap: Record<'Batam' | 'Jakarta', string> = {
    Batam: 'Kepulauan Riau',
    Jakarta: 'DKI Jakarta',
};

interface AddressFormProps {
    address?: Address;
    onCancel: () => void;
    onSuccess?: (addresses: Address[]) => void;
}

export default function AddressForm({ address, onCancel, onSuccess }: AddressFormProps) {
    const { t } = useTranslation();
    const isEdit = !!address;
    const initialCity = (address?.city ?? 'Batam') as 'Batam' | 'Jakarta';
    const { data, setData, post, patch, processing, errors } = useForm({
        label: address?.label ?? '',
        recipient_name: address?.recipient_name ?? '',
        recipient_phone: address?.recipient_phone ?? '',
        street_address: address?.street_address ?? '',
        city: initialCity,
        province: address?.province ?? cityProvinceMap[initialCity],
        postal_code: address?.postal_code ?? '',
        is_default: address?.is_default ?? false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page: { props: Record<string, unknown> }) => {
                const freshAddresses = page.props.addresses as Address[] | undefined;
                if (onSuccess && freshAddresses) {
                    onSuccess(freshAddresses);
                }
                onCancel();
            },
        };
        if (isEdit) {
            patch(`/addresses/${address.id}`, options);
        } else {
            post('/addresses', options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
            <div className="grid gap-1.5">
                <Label htmlFor="label">{t('addresses.label')}</Label>
                <Input
                    id="label"
                    value={data.label}
                    onChange={(e) => setData('label', e.target.value)}
                    placeholder={t('addresses.label_placeholder')}
                />
                <InputError message={errors.label} />
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="recipient_name">{t('checkout.recipient_name')}</Label>
                <Input
                    id="recipient_name"
                    value={data.recipient_name}
                    onChange={(e) => setData('recipient_name', e.target.value)}
                    required
                />
                <InputError message={errors.recipient_name} />
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="recipient_phone">{t('checkout.recipient_phone')}</Label>
                <Input
                    id="recipient_phone"
                    type="tel"
                    value={data.recipient_phone}
                    onChange={(e) => setData('recipient_phone', e.target.value)}
                    required
                />
                <InputError message={errors.recipient_phone} />
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="street_address">{t('addresses.street_address')}</Label>
                <Input
                    id="street_address"
                    value={data.street_address}
                    onChange={(e) => setData('street_address', e.target.value)}
                    required
                />
                <InputError message={errors.street_address} />
            </div>

            <div className="grid gap-1.5">
                <Label>{t('addresses.city_label')}</Label>
                <div className="flex gap-3">
                    {(['Batam', 'Jakarta'] as const).map((city) => (
                        <button
                            key={city}
                            type="button"
                            onClick={() => setData((prev) => ({ ...prev, city, province: cityProvinceMap[city] }))}
                            className={`flex-1 rounded-sm border py-2.5 text-sm font-semibold transition-colors
                                ${data.city === city ? 'border-foreground bg-foreground text-background' : 'border-input bg-background text-foreground hover:border-foreground/50'}`}
                        >
                            {city}
                        </button>
                    ))}
                </div>
                <InputError message={errors.city} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                    <Label>{t('addresses.province')}</Label>
                    <Input value={data.province} readOnly className="cursor-default bg-muted" />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="postal_code">{t('addresses.postal_code')}</Label>
                    <Input
                        id="postal_code"
                        value={data.postal_code}
                        onChange={(e) => setData('postal_code', e.target.value)}
                    />
                    <InputError message={errors.postal_code} />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Checkbox
                    id="is_default"
                    checked={data.is_default}
                    onCheckedChange={(checked) => setData('is_default', checked === true)}
                />
                <Label htmlFor="is_default" className="font-normal">
                    {t('addresses.set_default')}
                </Label>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={processing}>
                    {t('profile.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    );
}
