import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { ShoppingBag } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { MarketItemRow } from './MarketItemRow';
import { MarketItem } from '../../hooks/useMarketRun';
import { useLanguage } from '../../contexts/LanguageContext';

interface MarketShoppingListProps {
    shoppingSections: Record<string, MarketItem[]>;
    shoppingSectionKeys: string[];
    priceInputs: Record<string, string>;
    qtyInputs: Record<string, string>;
    expandedBreakdown: Record<string, boolean>;

    onPriceChange: (id: string, val: string) => void;
    onQtyChange: (id: string, val: string) => void;
    onToggleBought: (id: string, checked: boolean) => void;
    onToggleBreakdown: (id: string) => void;
}

export const MarketShoppingList = ({
    shoppingSections,
    shoppingSectionKeys,
    priceInputs,
    qtyInputs,
    expandedBreakdown,
    onPriceChange,
    onQtyChange,
    onToggleBought,
    onToggleBreakdown
}: MarketShoppingListProps) => {
    const { ui } = useLanguage();

    if (shoppingSectionKeys.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                <p>{ui('noItemsFound')}</p>
            </div>
        );
    }

    return (
        <Tabs defaultValue={shoppingSectionKeys[0]} className="w-full bg-gray-50/50">
            {/* Category Bar - Sticky? Maybe not needed as it might block content */}
            <div className="sticky top-[calc(var(--header-h)-1px)] z-30 bg-gray-50/95 backdrop-blur-sm border-b pb-1 pt-1 px-2 shadow-sm">
                <TabsList className="w-full justify-start overflow-x-auto h-auto bg-transparent p-0 gap-2 scrollbar-hide">
                    {shoppingSectionKeys.map(key => (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className="shrink-0 flex-none h-9 px-4 rounded-full border border-transparent bg-white text-xs font-semibold text-gray-600 shadow-sm data-[state=active]:bg-eden-600 data-[state=active]:text-white data-[state=active]:border-eden-600 data-[state=active]:shadow-md transition-all active:scale-95"
                        >
                            {key} <span className="ml-1 opacity-70 text-[10px]">({shoppingSections[key].length})</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            {shoppingSectionKeys.map(key => (
                <TabsContent key={key} value={key} className="space-y-1">
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                        <AnimatePresence>
                            {shoppingSections[key].map(item => (
                                <MarketItemRow
                                    key={item.product_id}
                                    item={item}
                                    priceInputValue={priceInputs[item.product_id] ?? ''}
                                    qtyInputValue={qtyInputs[item.product_id] ?? ''}
                                    isExpanded={!!expandedBreakdown[item.product_id]}
                                    onPriceChange={onPriceChange}
                                    onQtyChange={onQtyChange}
                                    onToggleBought={onToggleBought}
                                    onToggleBreakdown={onToggleBreakdown}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    );
};
