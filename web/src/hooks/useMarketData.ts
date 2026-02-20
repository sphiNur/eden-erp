import { useState, useCallback, useEffect, useRef } from 'react';
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

    // Use Refs for form inputs to prevent global re-renders on every keystroke
    const priceInputsRef = useRef<Record<string, string>>({});
    const unitPriceInputsRef = useRef<Record<string, string>>({});
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
            priceInputsRef.current = {};
            unitPriceInputsRef.current = {};
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

    // Context consumers will call these, but they won't trigger global re-renders
    const getPriceInput = useCallback((id: string) => priceInputsRef.current[id] || '', []);
    const getUnitPriceInput = useCallback((id: string) => unitPriceInputsRef.current[id] || '', []);

    const setPriceInput = useCallback((id: string, val: string) => {
        priceInputsRef.current[id] = val;
    }, []);

    const setUnitPriceInput = useCallback((id: string, val: string) => {
        unitPriceInputsRef.current[id] = val;
    }, []);

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

            // Auto-update total price in ref if unit price exists
            const unitPrice = parseFloat(unitPriceInputsRef.current[productId] || '0');
            if (unitPrice > 0) {
                priceInputsRef.current[productId] = Math.round(unitPrice * newTotal).toString();
            }

            return {
                ...item,
                breakdown: newBreakdown,
                purchase_quantity: newTotal
            };
        }));
    }, []);

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
            const priceVal = priceInputsRef.current[item.product_id] || '';
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
            priceInputsRef.current = {};
            unitPriceInputsRef.current = {};
            await fetchConsolidation();
        } catch (err) {
            console.error(err);
            WebApp.showAlert(ui('batchError'));
        } finally {
            WebApp.MainButton.hideProgress();
        }
    }, [items, marketLocation, ui, t, fetchConsolidation]);

    return {
        items,
        loading,
        getPriceInput,
        getUnitPriceInput,
        setPriceInput,
        setUnitPriceInput,
        marketLocation,
        updateStoreQuantity,
        toggleBought,
        handleFinalize,
        refresh: fetchConsolidation
    };
};
