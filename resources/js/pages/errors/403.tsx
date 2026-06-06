import { Head, Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';

export default function Error403() {
    return (
        <AdminLayout>
            <Head title="Access Denied" />
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShieldOff className="mb-4 h-16 w-16 text-destructive opacity-60" />
                <h1 className="text-3xl font-bold">403 — Access Denied</h1>
                <p className="mt-2 text-muted-foreground">You do not have permission to access this page.</p>
                <Button asChild className="mt-6">
                    <Link href="/admin">Go to Dashboard</Link>
                </Button>
            </div>
        </AdminLayout>
    );
}
