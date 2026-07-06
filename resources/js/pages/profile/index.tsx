import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomerLayout from '@/layouts/customer-layout';
import type { Address } from '@/types/address';

interface ProfilePageProps {
    defaultAddress: Address | null;
    addressesCount: number;
}

export default function ProfilePage({ defaultAddress, addressesCount }: ProfilePageProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const user = auth.user;

    const profileForm = useForm({
        name: user.name,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profileForm.patch('/profile', { preserveScroll: true });
    }

    function submitPassword(e: React.FormEvent) {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
            onError: (errors) => {
                if (errors.password) passwordInput.current?.focus();
                if (errors.current_password) currentPasswordInput.current?.focus();
            },
        });
    }

    return (
        <CustomerLayout>
            <Head title={t('profile.title')} />

            <div className="mx-auto max-w-2xl space-y-8">
                <h1 className="text-2xl font-bold text-slate-900">{t('profile.title')}</h1>

                {/* Profile Information */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">{t('profile.profile_info')}</h2>
                        <p className="mt-1 text-sm text-slate-500">{t('profile.profile_info_desc')}</p>
                    </div>

                    <form onSubmit={submitProfile} className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="name">{t('profile.name')}</Label>
                            <Input
                                id="name"
                                name="name"
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                autoComplete="name"
                                required
                            />
                            <InputError message={profileForm.errors.name} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label>{t('profile.email')}</Label>
                            <p className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                {user.email}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={profileForm.processing}>
                                {t('profile.save')}
                            </Button>
                            <Transition
                                show={profileForm.recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-slate-500">{t('profile.saved')}</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                {/* Delivery Addresses */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">{t('profile.addresses_title')}</h2>
                        <p className="mt-1 text-sm text-slate-500">{t('profile.addresses_desc')}</p>
                    </div>

                    {defaultAddress ? (
                        <p className="text-sm text-slate-600">
                            {defaultAddress.recipient_name} &middot; {defaultAddress.street_address}, {defaultAddress.city}
                            {addressesCount > 1 && (
                                <span className="text-slate-400"> {t('profile.more_addresses', { count: addressesCount - 1 })}</span>
                            )}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500">{t('profile.no_addresses')}</p>
                    )}

                    <Link href="/addresses" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
                        {t('profile.manage_addresses')}
                    </Link>
                </div>

                {/* Change Password */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">{t('profile.change_password')}</h2>
                        <p className="mt-1 text-sm text-slate-500">{t('profile.change_password_desc')}</p>
                    </div>

                    <form onSubmit={submitPassword} className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="current_password">{t('profile.current_password')}</Label>
                            <Input
                                id="current_password"
                                ref={currentPasswordInput}
                                type="password"
                                name="current_password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                autoComplete="current-password"
                            />
                            <InputError message={passwordForm.errors.current_password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password">{t('profile.new_password')}</Label>
                            <Input
                                id="password"
                                ref={passwordInput}
                                type="password"
                                name="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={passwordForm.errors.password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password_confirmation">{t('profile.confirm_password')}</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={passwordForm.errors.password_confirmation} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={passwordForm.processing}>
                                {t('profile.save_password')}
                            </Button>
                            <Transition
                                show={passwordForm.recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-slate-500">{t('profile.saved')}</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </div>
        </CustomerLayout>
    );
}
