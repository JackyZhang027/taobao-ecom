import { useForm, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function ChangeRequiredPassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/change-password', {
            onFinish: () => {
                setData('password', '');
                setData('password_confirmation', '');
            },
        });
    };

    return (
        <AuthLayout
            title="Password change required"
            description="An administrator has reset your password. Please set a new password to continue."
        >
            <Head title="Change Password" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="password">New password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoFocus
                            autoComplete="new-password"
                            placeholder="New password"
                            required
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm new password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                            required
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing && <Spinner />}
                        Update password
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
