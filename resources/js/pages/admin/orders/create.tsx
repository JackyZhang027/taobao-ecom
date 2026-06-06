import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInput } from '@/components/ui/number-input';
import { useCurrency } from '@/hooks/use-currency';
import AdminLayout from '@/layouts/admin-layout';

interface Customer {
    id: number;
    name: string;
    email: string;
}

interface ProductVariantOption {
    id: number;
    sku: string | null;
    price: number;
    price_idr: number;
}

interface ProductOption {
    id: number;
    slug: string;
    name: string;
    price: number;
    price_idr: number;
    delivery_charge_batam: number;
    delivery_charge_jakarta: number;
    variants: ProductVariantOption[];
}

interface OrderItem {
    product_id: number | '';
    variant_id: number | null;
    quantity: number;
}

interface AdminOrderCreateProps {
    customers: Customer[];
    products: ProductOption[];
    exchangeRate: number;
}

const KNOWN_CITIES = ['batam', 'jakarta'];

export default function AdminOrderCreate({ customers, products, exchangeRate }: AdminOrderCreateProps) {
    const { formatIdr } = useCurrency();
    const [items, setItems] = useState<OrderItem[]>([{ product_id: '', variant_id: null, quantity: 1 }]);
    const [city, setCity] = useState('');
    const [manualShippingRmb, setManualShippingRmb] = useState<number>(0);

    const isKnownCity = KNOWN_CITIES.includes(city.toLowerCase());

    const { data, setData, post, processing, errors } = useForm({
        user_id: '' as number | '',
        recipient_name: '',
        recipient_phone: '',
        street_address: '',
        city: '',
        province: '',
        postal_code: '',
        notes: '',
        manual_shipping_rmb: 0,
        items: items as OrderItem[],
    });

    // Sync items and city into form data
    useEffect(() => {
        setData('items', items);
    }, [items, setData]);

    useEffect(() => {
        setData('city', city);
    }, [city, setData]);

    useEffect(() => {
        setData('manual_shipping_rmb', manualShippingRmb);
    }, [manualShippingRmb, setData]);

    const addItem = () => setItems([...items, { product_id: '', variant_id: null, quantity: 1 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    const updateItem = (idx: number, field: keyof OrderItem, value: number | string | null) => {
        const updated = [...items];
        if (field === 'product_id') {
            updated[idx] = { product_id: value as number, variant_id: null, quantity: updated[idx].quantity };
        } else if (field === 'variant_id') {
            updated[idx] = { ...updated[idx], variant_id: value as number | null };
        } else if (field === 'quantity') {
            updated[idx] = { ...updated[idx], quantity: Math.max(1, Number(value)) };
        }
        setItems(updated);
    };

    // Compute subtotal from items
    const subtotalIdr = items.reduce((sum, item) => {
        if (!item.product_id) return sum;
        const product = products.find((p) => p.id === item.product_id);
        if (!product) return sum;
        if (item.variant_id) {
            const variant = product.variants.find((v) => v.id === item.variant_id);
            return sum + (variant?.price_idr ?? 0) * item.quantity;
        }
        return sum + product.price_idr * item.quantity;
    }, 0);

    // Compute shipping preview
    const shippingRmb = isKnownCity
        ? products
              .filter((p) => items.some((i) => i.product_id === p.id))
              .reduce((sum, p) => {
                  const charge = city.toLowerCase() === 'jakarta'
                      ? p.delivery_charge_jakarta
                      : p.delivery_charge_batam;
                  return sum + charge;
              }, 0)
        : manualShippingRmb;
    const shippingIdr = shippingRmb * exchangeRate;
    const grandTotalIdr = subtotalIdr + shippingIdr;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/orders', {
            onSuccess: () => toast.success('Order created successfully'),
            onError: () => toast.error('Please fix the errors and try again'),
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Order" />
            <AdminPageHeader title="Create Manual Order" />

            <form onSubmit={submit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer */}
                        <Card>
                            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Customer *</label>
                                    <select
                                        value={data.user_id}
                                        onChange={(e) => setData('user_id', Number(e.target.value))}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="">— Select Customer —</option>
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                        ))}
                                    </select>
                                    {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {items.map((item, idx) => {
                                    const product = products.find((p) => p.id === item.product_id);
                                    return (
                                        <div key={idx} className="grid grid-cols-1 gap-2 items-end sm:grid-cols-[2fr_1fr_auto_auto]">
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Product</label>
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) => updateItem(idx, 'product_id', Number(e.target.value))}
                                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                                    required
                                                >
                                                    <option value="">— Select —</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {product && product.variants.length > 0 && (
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Variant</label>
                                                    <select
                                                        value={item.variant_id ?? ''}
                                                        onChange={(e) => updateItem(idx, 'variant_id', e.target.value ? Number(e.target.value) : null)}
                                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                                    >
                                                        <option value="">— None —</option>
                                                        {product.variants.map((v) => (
                                                            <option key={v.id} value={v.id}>{v.sku ?? v.id} ({formatIdr(v.price_idr)})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                    className="w-20 border rounded px-2 py-1.5 text-sm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="text-red-500 hover:text-red-700 pb-1"
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Item
                                </Button>
                                {errors.items && <p className="text-xs text-red-500">{String(errors.items)}</p>}
                            </CardContent>
                        </Card>

                        {/* Address */}
                        <Card>
                            <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Recipient Name *</label>
                                        <input type="text" value={data.recipient_name} onChange={(e) => setData('recipient_name', e.target.value)}
                                            className="w-full border rounded px-3 py-2 text-sm" required />
                                        {errors.recipient_name && <p className="text-xs text-red-500 mt-1">{errors.recipient_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Recipient Phone *</label>
                                        <input type="tel" value={data.recipient_phone} onChange={(e) => setData('recipient_phone', e.target.value)}
                                            className="w-full border rounded px-3 py-2 text-sm" required />
                                        {errors.recipient_phone && <p className="text-xs text-red-500 mt-1">{errors.recipient_phone}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Street Address *</label>
                                    <input type="text" value={data.street_address} onChange={(e) => setData('street_address', e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm" required />
                                    {errors.street_address && <p className="text-xs text-red-500 mt-1">{errors.street_address}</p>}
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">City * <span className="text-xs text-slate-400">(free text)</span></label>
                                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                                            placeholder="e.g. Batam, Jakarta, Surabaya"
                                            className="w-full border rounded px-3 py-2 text-sm" required />
                                        {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Province</label>
                                        <input type="text" value={data.province} onChange={(e) => setData('province', e.target.value)}
                                            className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Postal Code</label>
                                        <input type="text" value={data.postal_code} onChange={(e) => setData('postal_code', e.target.value)}
                                            className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                {!isKnownCity && city.trim() !== '' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Delivery Charge (RMB) *
                                            <span className="text-xs text-slate-400 ml-1">Manual — city is not Batam/Jakarta</span>
                                        </label>
                                        <NumberInput
                                            value={String(manualShippingRmb)}
                                            onChange={(v) => setManualShippingRmb(parseFloat(v) || 0)}
                                        />
                                        {errors.manual_shipping_rmb && <p className="text-xs text-red-500 mt-1">{errors.manual_shipping_rmb}</p>}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Notes</label>
                                    <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                        rows={2} className="w-full border rounded px-3 py-2 text-sm resize-none" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <Card className="sticky top-4">
                            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatIdr(subtotalIdr)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping {isKnownCity ? `(${city})` : '(manual)'}</span>
                                    <span>{formatIdr(shippingIdr)}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-3">
                                    <span>Total</span>
                                    <span>{formatIdr(grandTotalIdr)}</span>
                                </div>
                                <Button type="submit" className="w-full mt-4" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Order'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
