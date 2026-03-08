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

declare global {
    interface Window {
        snap: {
            pay: (token: string, options: object) => void;
        };
    }
}
