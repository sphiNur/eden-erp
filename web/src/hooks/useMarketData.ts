import { useState, useCallback, useEffect } from 'react';
import { purchasesApi } from '../api/client';
import { ConsolidatedItem, BatchCreate, BatchItemInput } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import WebApp from '@twa-dev/sdk';

export interface MarketItem extends ConsolidatedItem {
    status: 'pending' | 'bought';
    purchase_price?: number;
    purchase_quantity?: number;
}

export const useMarketData = () => {
    const { t, ui } = useLanguage();
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
    const [unitPriceInputs, setUnitPriceInputs] = useState<Record<string, string>>({});
    const [marketLocation] = useState('Chorsu');

    const fetchConsolidation = useCallback(async () => {
        try {
            setLoading(true);
            const data = await purchasesApi.getConsolidation();
            const marketItems: MarketItem[] = data.map(i => ({
                ...i,
                status: 'pending',
                purchase_quantity: i.total_quantity_needed,
                breakdown: i.breakdown.map(b => ({ ...b }))
            }));
            setItems(marketItems);
        } catch (err) {
            console.error(err);
            WebApp.showAlert(ui('failedLoadItems'));
        } finally {
            setLoading(false);
        }
    }, [ui]);

    useEffect(() => {
        fetchConsolidation();
    }, [fetchConsolidation]);

    const handleUnitPriceChange = useCallback((id: string, val: string) => {
        setUnitPriceInputs(prev => ({ ...prev, [id]: val }));
        const item = items.find(i => i.product_id === id);
        if (item && val) {
            const unitPrice = parseFloat(val);
            const qty = item.purchase_quantity || 0;
            if (!isNaN(unitPrice) && qty > 0) {
                setPriceInputs(prev => ({ ...prev, [id]: Math.round(unitPrice * qty).toString() }));
            }
        }
    }, [items]);

    const handleTotalPriceChange = useCallback((id: string, val: string) => {
        setPriceInputs(prev => ({ ...prev, [id]: val }));
        const item = items.find(i => i.product_id === id);
        if (item && val) {
            const totalPrice = parseFloat(val);
            const qty = item.purchase_quantity || 0;
            if (!isNaN(totalPrice) && qty > 0) {
                setUnitPriceInputs(prev => ({ ...prev, [id]: Math.round(totalPrice / qty).toString() }));
            }
        }
    }, [items]);

    const updateStoreQuantity = useCallback((productId: string, storeName: string, newQtyVal: string) => {
        const newQty = parseFloat(newQtyVal);
        if (isNaN(newQty) || newQty < 0) return;

        setItems(prev => prev.map(item => {
            if (item.product_id !== productId) return item;

            const newBreakdown = item.breakdown.map(b => {
                if (b.store_name === storeName) {
                    return { ...b, quantity: newQty };
                }
                return b;
            });

            const newTotal = newBreakdown.reduce((sum, b) => sum + b.quantity, 0);

            // Auto-update total price if unit price exists
            const unitPrice = parseFloat(unitPriceInputs[productId] || '0');
            if (unitPrice > 0) {
                setPriceInputs(p => ({ ...p, [productId]: Math.round(unitPrice * newTotal).toString() }));
            }

            return {
                ...item,
                breakdown: newBreakdown,
                purchase_quantity: newTotal
            };
        }));
    }, [unitPriceInputs]);

    const toggleBought = useCallback((product_id: string, checked: boolean) => {
        setItems(prev => prev.map(i => {
            if (i.product_id !== product_id) return i;
            return { ...i, status: checked ? 'bought' : 'pending' };
        }));
        WebApp.HapticFeedback.impactOccurred('light');
    }, []);

    const handleFinalize = useCallback(async () => {
        const boughtItems = items.filter(i => i.status === 'bought');

        if (boughtItems.length === 0) {
            WebApp.showAlert(ui('noItemsBought'));
            return;
        }

        const validItems: BatchItemInput[] = [];
        for (const item of boughtItems) {
            const priceVal = priceInputs[item.product_id] || (item.purchase_price ? item.purchase_price.toString() : '');
            const qtyVal = item.purchase_quantity || 0;

            const finalPrice = parseFloat(priceVal || '0');

            if (finalPrice <= 0) {
                WebApp.showAlert(`${ui('enterValidCost')} ${t(item.product_name)}`);
                return;
            }
            if (qtyVal <= 0) {
                WebApp.showAlert(`${ui('enterValidQty')} ${t(item.product_name)}`);
                return;
            }

            validItems.push({
                product_id: item.product_id,
                total_quantity_bought: qtyVal,
                total_cost_uzs: finalPrice
            });
        }

        const payload: BatchCreate = {
            market_location: marketLocation || 'Unknown',
            items: validItems
        };

        try {
            WebApp.MainButton.showProgress(true);
            await purchasesApi.submitBatch(payload);
            WebApp.showAlert(ui('batchFinalized'));
            setPriceInputs({});
            setUnitPriceInputs({});
            await fetchConsolidation();
        } catch (err) {
            console.error(err);
            WebApp.showAlert(ui('batchError'));
        } finally {
            WebApp.MainButton.hideProgress();
        }
    }, [items, priceInputs, marketLocation, ui, t, fetchConsolidation]);

    return {
        items,
        loading,
        priceInputs,
        unitPriceInputs,
        marketLocation,
        handleTotalPriceChange,
        handleUnitPriceChange,
        updateStoreQuantity,
        toggleBought,
        handleFinalize,
        refresh: fetchConsolidation
    };
};
