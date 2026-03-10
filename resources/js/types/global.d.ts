import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            cartCount: number;
            exchangeRate: number;
            [key: string]: unknown;
        };
    }
}

interface SnapPayOptions {
    onSuccess?: (result: Record<string, unknown>) => void;
    onPending?: (result: Record<string, unknown>) => void;
    onError?: (result: Record<string, unknown>) => void;
    onClose?: () => void;
}

declare global {
    interface Window {
        snap: {
            pay: (token: string, options: SnapPayOptions) => void;
        };
    }
}
