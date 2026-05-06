import AppLogoIcon from '@/components/app-logo-icon';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name, shopSettings } = usePage<any>().props;

    return (
        <>
            <div className="flex aspect-square size-12 items-center justify-center rounded-md bg-transparent text-sidebar-primary-foreground overflow-hidden">
                {shopSettings?.logo ? (
                    <img src={shopSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <div className="flex aspect-square size-12 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                        <AppLogoIcon className="size-7 fill-current text-white dark:text-black" />
                    </div>
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
