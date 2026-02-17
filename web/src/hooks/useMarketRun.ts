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
    const [unitPriceInputs, setUnitPriceInputs] = useState<Record<string, string>>({});
    const [marketLocation] = useState('Chorsu');
    const [viewMode, setViewMode] = useState<ViewMode>('shopping');
    const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});

    const fetchConsolidation = useCallback(async () => {
        try {
            setLoading(true);
            const data = await purchasesApi.getConsolidation();
            const marketItems: MarketItem[] = data.map(i => ({
                ...i,
                status: 'pending',
                // Initialize bought quantity with needed quantity
                purchase_quantity: i.total_quantity_needed,
                // Initialize breakdown "filled" quantity if we had a specific field, 
                // but for now we'll assume the 'quantity' in breakdown is mutable or we map it.
                // To support "Shortage" (Bought < Needed), we should ideally separate them.
                // But for Market Run V1/V2, usually checking off means "Bought All".
                // If editing, we update the local breakdown 'quantity' to reflect "Bought".
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
                // Use the modified quantity (which represents what was bought/allocated)
                groups[b.store_name].push({
                    item: item,
                    qty: b.quantity
                });
            });
        });
        return groups;
    }, [items]);

    const storeKeys = useMemo(() => Object.keys(distributionSections).sort(), [distributionSections]);

    const handleUnitPriceChange = useCallback((id: string, val: string) => {
        setUnitPriceInputs(prev => ({ ...prev, [id]: val }));

        // Auto-calculate Total Price if Quantity exists
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

        // Auto-calculate Unit Price if Quantity exists
        const item = items.find(i => i.product_id === id);
        if (item && val) {
            const totalPrice = parseFloat(val);
            const qty = item.purchase_quantity || 0;
            if (!isNaN(totalPrice) && qty > 0) {
                setUnitPriceInputs(prev => ({ ...prev, [id]: Math.round(totalPrice / qty).toString() }));
            }
        }
    }, [items]);

    // Update specific store quantity in breakdown
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
            const priceVal = priceInputs[item.product_id] || (item.purchase_price ? item.purchase_price.toString() : '');
            // Use derived purchase_quantity
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
    };

    return {
        // State
        items,
        loading,
        priceInputs,
        unitPriceInputs,
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
        handleTotalPriceChange,
        handleUnitPriceChange,
        updateStoreQuantity,
        toggleBought,
        toggleBreakdown,
        handleFinalize,
        refresh: fetchConsolidation
    };
};
