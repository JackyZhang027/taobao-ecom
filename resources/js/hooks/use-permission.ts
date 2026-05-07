import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types';

export function usePermission() {
    const { auth } = usePage().props as { auth: Auth };

    const can = (permission: string): boolean => {
        if (auth.roles?.includes('admin')) return true;
        return auth.permissions?.includes(permission) ?? false;
    };

    const hasRole = (role: string): boolean => {
        return auth.roles?.includes(role) ?? false;
    };

    const canAny = (permissions: string[]): boolean => {
        return permissions.some((p) => can(p));
    };

    return { can, hasRole, canAny };
}
