import { useState, useMemo, useCallback } from 'react';
import { MarketItem } from './useMarketData';
import { useLanguage } from '../contexts/LanguageContext';

export type ViewMode = 'shopping' | 'distribution';

export const useMarketUI = (items: MarketItem[]) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<ViewMode>('shopping');
    const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});

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
                groups[b.store_name].push({ item, qty: b.quantity });
            });
        });
        return groups;
    }, [items]);

    const storeKeys = useMemo(() => Object.keys(distributionSections).sort(), [distributionSections]);

    // Group items by Stall
    const stallSections = useMemo(() => {
        const groups: Record<string, MarketItem[]> = {};
        items.forEach(item => {
            const stallName = item.category_name?.en || 'General';
            if (!groups[stallName]) groups[stallName] = [];
            groups[stallName].push(item);
        });
        return groups;
    }, [items]);

    const stallKeys = useMemo(() => Object.keys(stallSections).sort(), [stallSections]);

    const toggleBreakdown = useCallback((id: string) => {
        setExpandedBreakdown(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    return {
        viewMode,
        setViewMode,
        expandedBreakdown,
        toggleBreakdown,
        shoppingSections,
        shoppingSectionKeys,
        distributionSections,
        storeKeys,
        stallSections,
        stallKeys
    };
};
