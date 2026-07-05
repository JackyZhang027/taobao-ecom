import { useTranslation } from 'react-i18next';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { Address } from '@/types/address';

interface AddressCardProps {
    address: Address;
    selectable?: boolean;
    selected?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetDefault?: () => void;
}

export default function AddressCard({ address, selectable = false, selected = false, onEdit, onDelete, onSetDefault }: AddressCardProps) {
    const { t } = useTranslation();
    const radioId = `address-${address.id}`;

    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-sm border p-4 transition-colors duration-150',
                selectable && selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white',
            )}
        >
            {selectable && <RadioGroupItem value={String(address.id)} id={radioId} className="mt-1" />}
            <label htmlFor={selectable ? radioId : undefined} className={cn('min-w-0 flex-1', selectable && 'cursor-pointer')}>
                <div className="flex items-center gap-2">
                    {address.label && <span className="text-sm font-semibold text-slate-900">{address.label}</span>}
                    {address.is_default && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {t('addresses.default_badge')}
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-900">
                    {address.recipient_name} &middot; {address.recipient_phone}
                </p>
                <p className="text-sm text-slate-500">
                    {address.street_address}, {address.city}
                    {address.province ? `, ${address.province}` : ''}
                    {address.postal_code ? ` ${address.postal_code}` : ''}
                </p>
            </label>
            {(onEdit || onDelete || onSetDefault) && (
                <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
                    <div className="flex gap-3">
                        {onEdit && (
                            <button type="button" onClick={onEdit} className="text-blue-600 hover:underline">
                                {t('common.edit')}
                            </button>
                        )}
                        {onDelete && (
                            <button type="button" onClick={onDelete} className="text-red-600 hover:underline">
                                {t('common.delete')}
                            </button>
                        )}
                    </div>
                    {!address.is_default && onSetDefault && (
                        <button type="button" onClick={onSetDefault} className="text-xs text-slate-500 hover:underline">
                            {t('addresses.set_default')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
