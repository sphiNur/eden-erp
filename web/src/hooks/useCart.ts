import { useState, useCallback, useMemo } from 'react';
import { Product } from '../types';
import { haptic } from '../lib/telegram';

export const useCart = (products: Product[]) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const setQty = useCallback((productId: string, val: number) => {
        setQuantities(prev => ({ ...prev, [productId]: val }));
        if (val > 0) haptic.impact('light');
    }, []);

    const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    const cartItems = useMemo(
        () => Object.entries(quantities)
            .filter(([, qty]) => qty > 0)
            .map(([pid, qty]) => ({ product: productMap.get(pid), qty })),
        [quantities, productMap]
    );

    const totalCount = cartItems.length;

    const estimatedTotal = useMemo(
        () => cartItems.reduce((sum, { product, qty }) =>
            sum + (product?.price_reference || 0) * qty, 0),
        [cartItems]
    );

    const reset = useCallback(() => setQuantities({}), []);

    return {
        quantities,
        setQuantities,
        setQty,
        cartItems,
        totalCount,
        estimatedTotal,
        reset
    };
};
