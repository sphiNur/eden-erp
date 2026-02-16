import { useState, useMemo, useEffect, useCallback } from 'react';
import { purchasesApi } from '../api/client';
import { ConsolidatedItem, BatchCreate, BatchItemInput } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import WebApp from '@twa-dev/sdk';

export interface MarketItem extends ConsolidatedItem {
    status: 'pending' | 'bought';
    purchase_price?: number;
    purchase_quantity?: number;
}

export type ViewMode = 'shopping' | 'distribution';

export const useMarketRun = () => {
    const { t, ui } = useLanguage();
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
    const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
    const [marketLocation] = useState('Chorsu');
    const [viewMode, setViewMode] = useState<ViewMode>('shopping');
    const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});

    const fetchConsolidation = useCallback(async () => {
        try {
            setLoading(true);
            const data = await purchasesApi.getConsolidation();
            const marketItems: MarketItem[] = data.map(i => ({
                ...i,
                status: 'pending'
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

    // Group items by category for Shopping Mode
    const shoppingSections = useMemo(() => {
        const groups: Record<string, MarketItem[]> = {};
        items.forEach(item => {
            const catName = t(item.category_name);
            if (!groups[catName]) groups[catName] = [];
            groups[catName].push(item);
        });
        return groups;
    }, [items, t]);

    const shoppingSectionKeys = useMemo(() => Object.keys(shoppingSections), [shoppingSections]);

    // Group items by Store for Distribution Mode
    const distributionSections = useMemo(() => {
        const groups: Record<string, { item: MarketItem, qty: number }[]> = {};

        items.forEach(item => {
            item.breakdown.forEach(b => {
                if (!groups[b.store_name]) groups[b.store_name] = [];
                groups[b.store_name].push({
                    item: item,
                    qty: b.quantity
                });
            });
        });
        return groups;
    }, [items]);

    const storeKeys = useMemo(() => Object.keys(distributionSections).sort(), [distributionSections]);

    const handlePriceChange = useCallback((id: string, val: string) => {
        setPriceInputs(prev => ({ ...prev, [id]: val }));
    }, []);

    const handleQtyChange = useCallback((id: string, val: string) => {
        setQtyInputs(prev => ({ ...prev, [id]: val }));
    }, []);

    const toggleBought = useCallback((product_id: string, checked: boolean) => {
        setItems(prev => prev.map(i => {
            if (i.product_id !== product_id) return i;

            const newStatus = checked ? 'bought' : 'pending';
            // We use current state or defaults
            // Note: In the original code, it read from state directly. 
            // Inside setState callback, we strictly shouldn't read other state if we can avoid it, 
            // but here priceInputs/qtyInputs are separate atoms. 
            // We'll trust the user will fill them. 
            // Actually, the original code logic was:
            // const priceVal = priceInputs[i.product_id];
            // ...
            // This is tricky inside a callback if priceInputs isn't in dependency.
            // Let's rely on the input values being present or defaulting at finalization time mostly, 
            // but the Status toggle did some logic. 
            // For now, let's keep status toggle simple and do the heavy lifting in finalize or render.
            // Wait, the original code DID read priceInputs/qtyInputs inside the toggle.
            // To do this cleanly, we might need `priceInputs` in dependency or usage of ref.

            return { ...i, status: newStatus };
        }));
        WebApp.HapticFeedback.impactOccurred('light');
    }, []);

    // We need to fix the logic where toggleBought relied on current inputs to "freeze" them into the item?
    // Actually, looking at original code:
    // const priceVal = priceInputs[i.product_id]; ...
    // It used the inputs to update the item's `purchase_price` field.
    // If we want to preserve this behavior without stale closures, we should pass inputs to this function
    // or use a ref for inputs.
    // Let's use the latter approach for inputs in the hook to avoid re-creating handlers constantly?
    // Or just accept that we might not "save" the intermediate input value into the item object until finalize.
    // The Input fields rely on `qtyInputs` state primarily. The `item.purchase_price` is a fallback.
    // So simple toggle is fine.

    const toggleBreakdown = useCallback((id: string) => {
        setExpandedBreakdown(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleFinalize = async () => {
        const boughtItems = items.filter(i => i.status === 'bought');

        if (boughtItems.length === 0) {
            WebApp.showAlert(ui('noItemsBought'));
            return;
        }

        const validItems: BatchItemInput[] = [];
        for (const item of boughtItems) {
            const priceVal = priceInputs[item.product_id] || item.purchase_price?.toString();
            const qtyVal = qtyInputs[item.product_id] || item.total_quantity_needed.toString();
            const finalPrice = parseFloat(priceVal || '0');
            const finalQty = parseFloat(qtyVal || '0');

            if (finalPrice <= 0) {
                WebApp.showAlert(`${ui('enterValidCost')} ${t(item.product_name)}`);
                return;
            }
            if (finalQty <= 0) {
                WebApp.showAlert(`${ui('enterValidQty')} ${t(item.product_name)}`);
                return;
            }

            validItems.push({
                product_id: item.product_id,
                total_quantity_bought: finalQty,
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
            setQtyInputs({});
            await fetchConsolidation();
        } catch (err) {
            console.error(err);
            WebApp.showAlert(ui('batchError'));
        } finally {
            WebApp.MainButton.hideProgress();
        }
    };

    return {
        // State
        items,
        loading,
        priceInputs,
        qtyInputs,
        marketLocation,
        viewMode,
        expandedBreakdown,

        // Computed
        shoppingSections,
        shoppingSectionKeys,
        distributionSections,
        storeKeys,

        // Actions
        setViewMode,
        handlePriceChange,
        handleQtyChange,
        toggleBought,
        toggleBreakdown,
        handleFinalize,
        refresh: fetchConsolidation
    };
};
