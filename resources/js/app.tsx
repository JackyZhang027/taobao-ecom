import '@/i18n';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { Toaster } from '@/components/ui/sonner';
import { initializeTheme } from '@/hooks/use-appearance';

let shopName = import.meta.env.VITE_APP_NAME || 'Shop';

createInertiaApp({
    title: (title) => (title ? `${title} - ${shopName}` : shopName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        shopName = (props.initialPage.props as any).name ?? shopName;

        router.on('success', (event) => {
            shopName = (event.detail.page.props as any).name ?? shopName;
        });

        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
                <Toaster />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
