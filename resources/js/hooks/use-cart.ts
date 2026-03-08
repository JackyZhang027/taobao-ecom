import { router } from '@inertiajs/react';

export function useCart() {
    const addItem = (variantId: number, qty = 1) =>
        router.post('/cart', { product_variant_id: variantId, quantity: qty }, { preserveScroll: true });

    const addProduct = (productId: number, qty = 1) =>
        router.post('/cart', { product_id: productId, quantity: qty }, { preserveScroll: true });

    const updateItem = (cartItemId: number, qty: number) =>
        router.patch(`/cart/${cartItemId}`, { quantity: qty }, { preserveScroll: true });

    const removeItem = (cartItemId: number) => router.delete(`/cart/${cartItemId}`, { preserveScroll: true });

    return { addItem, addProduct, updateItem, removeItem };
}
