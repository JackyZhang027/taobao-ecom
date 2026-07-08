import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import type { ShopSetting } from '@/types/settings';

const MAX_POLL_ATTEMPTS = 40;
const POLL_INTERVAL_MS = 3000;

const DISCONNECT_ENABLED = true;

const ORDER_PAID_DEFAULT_TEMPLATE = `🔔 New Paid Order
Order: #{order_no}
Customer: {customer_name}
Phone: {customer_phone}
Total: Rp {total}`;

const PAYMENT_REMINDER_DEFAULT_TEMPLATE = `⏰ Payment Reminder
Hi {customer_name}, your order #{order_no} (Rp {total}) is still unpaid.
Please complete your payment here:
{link}

If you've already paid, please ignore this message.`;

function csrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

async function postJson(url: string, body: Record<string, unknown> = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(body),
    });

    return response.json();
}

type QrResponse = {
    status?: boolean | string;
    qrcode?: string;
    message?: string;
    msg?: string;
};

type TimelockResponse = {
    is_active: boolean;
    unlock_at?: string | null;
    enforcement_type?: string | null;
};

type DeviceInfoResponse = {
    status?: boolean;
    name?: string | null;
    number?: string | null;
    pp_url?: string | null;
};

function formatUnlockAt(raw: string): string {
    return new Date(raw).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AdminWhatsappSettings({
    settings,
}: {
    settings: ShopSetting;
}) {
    const { data, setData, post, processing } = useForm<{
        settings: Record<string, string>;
    }>({
        settings: {
            whatsapp_sender: settings.whatsapp_sender || '',
            whatsapp_admin_numbers: settings.whatsapp_admin_numbers || '',
            whatsapp_customer_reminder_enabled:
                settings.whatsapp_customer_reminder_enabled || '0',
            whatsapp_customer_reminder_schedule:
                settings.whatsapp_customer_reminder_schedule || '10m,6h,23h',
            whatsapp_order_paid_template:
                settings.whatsapp_order_paid_template || '',
            whatsapp_payment_reminder_template:
                settings.whatsapp_payment_reminder_template || '',
        },
    });

    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(
        !!settings.whatsapp_sender,
    );
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [timelock, setTimelock] = useState<TimelockResponse | null>(null);
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfoResponse | null>(
        null,
    );
    const [deviceInfoLoading, setDeviceInfoLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const attemptsRef = useRef(0);

    useEffect(() => {
        if (settings.whatsapp_sender) {
            postJson('/admin/settings/whatsapp/qr', { force: false })
                .then((response: QrResponse) => {
                    if (isConnectedResponse(response)) setConnected(true);
                })
                .catch(() => {})
                .finally(() => setCheckingStatus(false));

            postJson('/admin/settings/whatsapp/check-timelock')
                .then((response: TimelockResponse) => setTimelock(response))
                .catch(() => {});
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!connected) {
            setDeviceInfo(null);
            setDeviceInfoLoading(false);
            return;
        }

        setDeviceInfoLoading(true);
        postJson('/admin/settings/whatsapp/device-info')
            .then((response: DeviceInfoResponse) => {
                if (response.status) setDeviceInfo(response);
            })
            .catch(() => {})
            .finally(() => setDeviceInfoLoading(false));
    }, [connected]);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const isConnectedResponse = (response: QrResponse) => {
        const text =
            `${response.message ?? ''} ${response.msg ?? ''}`.toLowerCase();
        return text.includes('already connected');
    };

    const pollQr = async (force: boolean) => {
        attemptsRef.current += 1;

        if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
            stopPolling();
            setConnecting(false);
            setStatusMessage(
                'Timed out waiting for the QR code. Click "Connect Device" to try again.',
            );
            return;
        }

        try {
            const response: QrResponse = await postJson(
                '/admin/settings/whatsapp/qr',
                { force },
            );

            if (isConnectedResponse(response)) {
                stopPolling();
                setConnecting(false);
                setConnected(true);
                setQrCode(null);
                setStatusMessage(null);
                return;
            }

            if (response.qrcode) {
                setQrCode(response.qrcode);
                setStatusMessage(
                    'Scan this QR code with the WhatsApp gateway device.',
                );
                return;
            }

            setStatusMessage(
                response.message || 'Generating QR code, please wait...',
            );
        } catch {
            stopPolling();
            setConnecting(false);
            setStatusMessage('Failed to reach the WhatsApp gateway.');
        }
    };

    const startConnecting = () => {
        if (!data.settings.whatsapp_sender) {
            toast.error('Set a sender device number first');
            return;
        }

        setConnecting(true);
        setConnected(false);
        setQrCode(null);
        setStatusMessage('Generating QR code, please wait...');
        attemptsRef.current = 0;

        pollQr(true);
        pollRef.current = setInterval(() => pollQr(false), POLL_INTERVAL_MS);
    };

    const disconnectDevice = async () => {
        setDisconnecting(true);

        try {
            const response: QrResponse = await postJson(
                '/admin/settings/whatsapp/logout-device',
            );

            if (response.status === true) {
                toast.success(
                    response.message || response.msg || 'Device disconnected',
                );
                stopPolling();
                setConnecting(false);
                setConnected(false);
                setQrCode(null);
                setStatusMessage(null);
            } else {
                toast.error(
                    response.msg ||
                        response.message ||
                        'Failed to disconnect device',
                );
            }
        } catch {
            toast.error('Failed to reach the WhatsApp gateway');
        } finally {
            setDisconnecting(false);
            setConfirmOpen(false);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings/whatsapp', {
            onSuccess: () =>
                toast.success('WhatsApp settings updated successfully'),
            onError: () => toast.error('Failed to update settings'),
        });
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { title: 'Settings', href: '/admin/settings/shop' },
                { title: 'WhatsApp', href: '' },
            ]}
        >
            <Head title="WhatsApp Settings" />

            {timelock?.is_active && (
                <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
                    <p className="font-medium text-yellow-800">
                        WhatsApp account suspended
                    </p>
                    <p className="mt-1 text-sm text-yellow-700">
                        This WhatsApp number has been temporarily suspended by
                        WhatsApp. Notifications will not be delivered until it
                        unlocks
                        {timelock.unlock_at
                            ? ` on ${formatUnlockAt(timelock.unlock_at)}`
                            : ''}
                        .
                    </p>
                </div>
            )}

            <form onSubmit={submit}>
                <AdminPageHeader
                    title="WhatsApp Settings"
                    subtitle="Configure the WhatsApp gateway used to notify admins about new paid orders"
                    actions={
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => history.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="whatsapp_sender">
                                        Sender Device Number
                                    </Label>
                                    <Input
                                        id="whatsapp_sender"
                                        value={data.settings.whatsapp_sender}
                                        onChange={(e: any) =>
                                            setData('settings', {
                                                ...data.settings,
                                                whatsapp_sender: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 6281234567890 (no + or spaces)"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The WhatsApp device that sends
                                        notifications. Save this before
                                        connecting.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="whatsapp_admin_numbers">
                                        Admin Notification Numbers
                                    </Label>
                                    <Input
                                        id="whatsapp_admin_numbers"
                                        value={
                                            data.settings.whatsapp_admin_numbers
                                        }
                                        onChange={(e: any) =>
                                            setData('settings', {
                                                ...data.settings,
                                                whatsapp_admin_numbers:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 628111111111,628222222222"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Comma-separated numbers that receive a
                                        WhatsApp alert for every new paid order.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Customer Payment Reminders</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="whatsapp_customer_reminder_enabled"
                                        checked={
                                            data.settings
                                                .whatsapp_customer_reminder_enabled ===
                                            '1'
                                        }
                                        onCheckedChange={(checked) =>
                                            setData('settings', {
                                                ...data.settings,
                                                whatsapp_customer_reminder_enabled:
                                                    checked ? '1' : '0',
                                            })
                                        }
                                    />
                                    <Label
                                        htmlFor="whatsapp_customer_reminder_enabled"
                                        className="cursor-pointer"
                                    >
                                        Enable payment reminders
                                    </Label>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="whatsapp_customer_reminder_schedule">
                                        Reminder Schedule
                                    </Label>
                                    <Input
                                        id="whatsapp_customer_reminder_schedule"
                                        value={
                                            data.settings
                                                .whatsapp_customer_reminder_schedule
                                        }
                                        onChange={(e: any) =>
                                            setData('settings', {
                                                ...data.settings,
                                                whatsapp_customer_reminder_schedule:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 10m,6h,1d"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Comma-separated durations after order
                                        creation at which an unpaid customer
                                        is reminded via WhatsApp. Use{' '}
                                        <code>m</code> for minutes,{' '}
                                        <code>h</code> for hours, and{' '}
                                        <code>d</code> for days. Minimum 10
                                        minutes per step.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Message Templates</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <Label htmlFor="whatsapp_order_paid_template">
                                        New Paid Order Alert (to admins)
                                    </Label>
                                    <Textarea
                                        id="whatsapp_order_paid_template"
                                        rows={8}
                                        value={
                                            data.settings
                                                .whatsapp_order_paid_template
                                        }
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                whatsapp_order_paid_template:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder={ORDER_PAID_DEFAULT_TEMPLATE}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave blank to use the default text
                                        above. Available placeholders:{' '}
                                        <code>{'{order_no}'}</code>,{' '}
                                        <code>{'{date}'}</code>,{' '}
                                        <code>{'{customer_name}'}</code>,{' '}
                                        <code>{'{customer_phone}'}</code>,{' '}
                                        <code>{'{total}'}</code>,{' '}
                                        <code>{'{shop_name}'}</code>.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="whatsapp_payment_reminder_template">
                                        Payment Reminder (to customer)
                                    </Label>
                                    <Textarea
                                        id="whatsapp_payment_reminder_template"
                                        rows={16}
                                        value={
                                            data.settings
                                                .whatsapp_payment_reminder_template
                                        }
                                        onChange={(e) =>
                                            setData('settings', {
                                                ...data.settings,
                                                whatsapp_payment_reminder_template:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder={
                                            PAYMENT_REMINDER_DEFAULT_TEMPLATE
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave blank to use the default text
                                        above. Available placeholders:{' '}
                                        <code>{'{order_no}'}</code>,{' '}
                                        <code>{'{date}'}</code>,{' '}
                                        <code>{'{customer_name}'}</code>,{' '}
                                        <code>{'{customer_phone}'}</code>,{' '}
                                        <code>{'{total}'}</code>,{' '}
                                        <code>{'{link}'}</code>,{' '}
                                        <code>{'{shop_name}'}</code>.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Device Connection
                                    {connected && (
                                        <Badge className="border-transparent bg-green-600 text-white [a&]:hover:bg-green-600/90 dark:bg-green-600/80">
                                            Connected
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {checkingStatus ||
                                (connected && deviceInfoLoading) ? (
                                    <div className="flex gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            Checking connection status...
                                        </p>
                                    </div>
                                ) : connected && deviceInfo?.status ? (
                                    <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center">
                                        {deviceInfo.pp_url && (
                                            <img
                                                src={deviceInfo.pp_url}
                                                alt={
                                                    deviceInfo.name ||
                                                    'Profile photo'
                                                }
                                                className="h-48 w-48 rounded-none object-cover"
                                            />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">
                                                {deviceInfo.name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {deviceInfo.number}
                                            </p>
                                        </div>
                                        {DISCONNECT_ENABLED && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    setConfirmOpen(true)
                                                }
                                            >
                                                Disconnect Device
                                            </Button>
                                        )}
                                    </div>
                                ) : connected ? (
                                    DISCONNECT_ENABLED && (
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() =>
                                                    setConfirmOpen(true)
                                                }
                                            >
                                                Disconnect Device
                                            </Button>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={startConnecting}
                                            disabled={connecting}
                                        >
                                            {connecting
                                                ? 'Connecting...'
                                                : 'Connect Device'}
                                        </Button>
                                    </div>
                                )}

                                {qrCode && (
                                    <div className="flex justify-center">
                                        <img
                                            src={qrCode}
                                            alt="WhatsApp QR code"
                                            className="h-48 w-48 rounded border"
                                        />
                                    </div>
                                )}

                                {statusMessage && (
                                    <p className="text-sm text-muted-foreground">
                                        {statusMessage}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect WhatsApp device?</DialogTitle>
                        <DialogDescription>
                            Admin notifications for new paid orders will stop
                            until you reconnect and scan a new QR code.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                            disabled={disconnecting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={disconnectDevice}
                            disabled={disconnecting}
                        >
                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
