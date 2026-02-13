import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Loader2, Calculator } from 'lucide-react';
import { ConsolidatedItem, BatchCreate, BatchItemInput } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

import { purchasesApi } from '../api/client';
import WebApp from '@twa-dev/sdk';

import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

// --- Types ---
interface MarketItem extends ConsolidatedItem {
    status: 'pending' | 'bought';
    purchase_price?: number;
    purchase_quantity?: number;
}

export const MarketRun = () => {
    const { t, ui } = useLanguage();
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
    const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
    const [marketLocation, setMarketLocation] = useState('Chorsu');

    const fetchConsolidation = async () => {
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
    };

    useEffect(() => {
        fetchConsolidation();
    }, []);

    // Group items by category
    const sections = useMemo(() => {
        const groups: Record<string, MarketItem[]> = {};
        items.forEach(item => {
            const catName = t(item.category_name);
            if (!groups[catName]) groups[catName] = [];
            groups[catName].push(item);
        });
        return groups;
    }, [items, t]);

    const sectionKeys = Object.keys(sections);

    const handlePriceChange = (id: string, val: string) => {
        setPriceInputs(prev => ({ ...prev, [id]: val }));
    };

    const handleQtyChange = (id: string, val: string) => {
        setQtyInputs(prev => ({ ...prev, [id]: val }));
    };

    const toggleBought = (product_id: string, checked: boolean) => {
        setItems(prev => prev.map(i => {
            if (i.product_id !== product_id) return i;

            const newStatus = checked ? 'bought' : 'pending';
            const priceVal = priceInputs[i.product_id];
            const qtyVal = qtyInputs[i.product_id];
            const price = priceVal ? parseFloat(priceVal) : i.purchase_price;
            const qty = qtyVal ? parseFloat(qtyVal) : i.total_quantity_needed;

            if (checked && !qtyVal) {
                setQtyInputs(prev => ({ ...prev, [product_id]: i.total_quantity_needed.toString() }));
            }

            return { ...i, status: newStatus, purchase_price: price, purchase_quantity: qty };
        }));
        WebApp.HapticFeedback.impactOccurred('light');
    };

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
            // Re-fetch to get accurate server state (L6 fix)
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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-eden-500" size={48} />
            </div>
        );
    }

    return (
        <div className="bg-[var(--tg-theme-bg-color,#f3f4f6)]">
            {/* Progress bar */}
            <div className="sticky top-header z-toolbar bg-white/80 backdrop-blur-md border-b px-3 py-1.5 shadow-sm flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                    {items.filter(i => i.status === 'bought').length} / {items.length} {ui('done')}
                </span>
            </div>

            <main className="p-3">
                {sectionKeys.length > 0 ? (
                    <Tabs defaultValue={sectionKeys[0]} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto mb-2 bg-gray-100 p-0.5 rounded-lg h-auto">
                            {sectionKeys.map(key => (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    className="flex-1 min-w-[80px] text-xs py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                                >
                                    {key} ({sections[key].length})
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {sectionKeys.map(key => (
                            <TabsContent key={key} value={key} className="space-y-1">
                                <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                                    <AnimatePresence>
                                        {sections[key].map(item => {
                                            const pVal = priceInputs[item.product_id] ?? '';
                                            const qVal = qtyInputs[item.product_id] ?? item.total_quantity_needed.toString();
                                            const priceNum = parseFloat(pVal);
                                            const qtyNum = parseFloat(qVal);
                                            const unitPrice = (priceNum && qtyNum) ? (priceNum / qtyNum) : 0;

                                            return (
                                                <motion.div
                                                    layout
                                                    key={item.product_id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className={cn(
                                                        "px-3 py-2 flex flex-col gap-1.5 transition-colors",
                                                        item.status === 'bought' ? "bg-emerald-50/50" : "hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <div className={cn(
                                                                    "font-semibold text-[13px] truncate text-gray-900",
                                                                    item.status === 'bought' && "text-emerald-800 opacity-60 line-through"
                                                                )}>
                                                                    {t(item.product_name)}
                                                                </div>
                                                                <Badge variant={item.status === 'bought' ? "secondary" : "outline"} className="shrink-0 h-4 px-1 text-[9px] font-mono">
                                                                    {item.total_quantity_needed} {t(item.unit)}
                                                                </Badge>
                                                            </div>
                                                            {item.price_reference && (
                                                                <div className="text-xs text-gray-500 font-mono">
                                                                    Ref: {item.price_reference.toLocaleString()} UZS
                                                                </div>
                                                            )}
                                                        </div>

                                                        <Checkbox
                                                            checked={item.status === 'bought'}
                                                            onCheckedChange={(c) => toggleBought(item.product_id, c as boolean)}
                                                            className="h-8 w-8 rounded-full data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all shrink-0"
                                                        />
                                                    </div>

                                                    <AnimatePresence>
                                                        {item.status !== 'bought' && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="grid grid-cols-2 gap-1.5 mt-0.5"
                                                            >
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ui('qty')}</span>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder={item.total_quantity_needed.toString()}
                                                                        className="h-10 pt-3.5 text-right font-mono font-bold text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                                                        value={qtyInputs[item.product_id] ?? ''}
                                                                        onChange={(e) => handleQtyChange(item.product_id, e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ui('totalCost')}</span>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        className="h-10 pt-3.5 text-right font-mono font-bold text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                                                        value={priceInputs[item.product_id] ?? ''}
                                                                        onChange={(e) => handlePriceChange(item.product_id, e.target.value)}
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {(unitPrice > 0 && item.status !== 'bought') && (
                                                        <div className="flex justify-end items-center gap-1 text-[10px] text-eden-500 font-medium">
                                                            <Calculator size={10} />
                                                            <span>~{unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} UZS / {t(item.unit)}</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </AnimatePresence>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                        <p>{ui('noItemsFound')}</p>
                    </div>
                )}
            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-lg border-t z-drawer">
                <Button
                    size="lg"
                    onClick={handleFinalize}
                    className="w-full text-base font-bold py-4 rounded-xl shadow-xl shadow-eden-500/20 active:scale-[0.98] transition-transform"
                >
                    {ui('finalizeBatch')}
                </Button>
            </div>
        </div>
    );
};
