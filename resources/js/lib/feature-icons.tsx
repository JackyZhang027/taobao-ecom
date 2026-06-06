import type { LucideIcon } from 'lucide-react';
import {
    Truck,
    Package,
    PackageCheck,
    Rocket,
    Zap,
    RotateCcw,
    RefreshCw,
    Shield,
    ShieldCheck,
    Lock,
    BadgeCheck,
    CreditCard,
    Wallet,
    Phone,
    Headphones,
    MessageCircle,
    Clock,
    Star,
    Award,
    ThumbsUp,
    CheckCircle,
    Medal,
    MapPin,
    Gift,
    Heart,
} from 'lucide-react';

export const FEATURE_ICONS: Record<string, LucideIcon> = {
    Truck,
    Package,
    PackageCheck,
    Rocket,
    Zap,
    RotateCcw,
    RefreshCw,
    Shield,
    ShieldCheck,
    Lock,
    BadgeCheck,
    CreditCard,
    Wallet,
    Phone,
    Headphones,
    MessageCircle,
    Clock,
    Star,
    Award,
    ThumbsUp,
    CheckCircle,
    Medal,
    MapPin,
    Gift,
    Heart,
};

export interface FeatureIconOption {
    value: string;
    label: string;
    category: string;
}

export const FEATURE_ICON_OPTIONS: FeatureIconOption[] = [
    { value: 'Truck',        label: 'Truck',          category: 'Delivery' },
    { value: 'Package',      label: 'Package',         category: 'Delivery' },
    { value: 'PackageCheck', label: 'Package Check',   category: 'Delivery' },
    { value: 'Rocket',       label: 'Rocket',          category: 'Delivery' },
    { value: 'Zap',          label: 'Zap',             category: 'Delivery' },
    { value: 'RotateCcw',    label: 'Return',          category: 'Returns' },
    { value: 'RefreshCw',    label: 'Refresh',         category: 'Returns' },
    { value: 'Shield',       label: 'Shield',          category: 'Security' },
    { value: 'ShieldCheck',  label: 'Shield Check',    category: 'Security' },
    { value: 'Lock',         label: 'Lock',            category: 'Security' },
    { value: 'BadgeCheck',   label: 'Badge Check',     category: 'Security' },
    { value: 'CreditCard',   label: 'Credit Card',     category: 'Payment' },
    { value: 'Wallet',       label: 'Wallet',          category: 'Payment' },
    { value: 'Phone',        label: 'Phone',           category: 'Support' },
    { value: 'Headphones',   label: 'Headphones',      category: 'Support' },
    { value: 'MessageCircle',label: 'Message',         category: 'Support' },
    { value: 'Clock',        label: 'Clock',           category: 'Support' },
    { value: 'Star',         label: 'Star',            category: 'Quality' },
    { value: 'Award',        label: 'Award',           category: 'Quality' },
    { value: 'ThumbsUp',     label: 'Thumbs Up',       category: 'Quality' },
    { value: 'CheckCircle',  label: 'Check Circle',    category: 'Quality' },
    { value: 'Medal',        label: 'Medal',           category: 'Quality' },
    { value: 'MapPin',       label: 'Map Pin',         category: 'Other' },
    { value: 'Gift',         label: 'Gift',            category: 'Other' },
    { value: 'Heart',        label: 'Heart',           category: 'Other' },
];

interface FeatureIconProps {
    icon: string;
    className?: string;
}

export function FeatureIcon({ icon, className = 'w-5 h-5' }: FeatureIconProps) {
    const IconComponent = FEATURE_ICONS[icon];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
}
