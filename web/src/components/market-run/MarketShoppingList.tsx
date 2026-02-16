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
        <Tabs defaultValue={shoppingSectionKeys[0]} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto mb-2 bg-gray-100 p-0.5 rounded-lg h-auto scrollbar-hide">
                {shoppingSectionKeys.map(key => (
                    <TabsTrigger
                        key={key}
                        value={key}
                        className="flex-1 min-w-[80px] text-xs py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                        {key} ({shoppingSections[key].length})
                    </TabsTrigger>
                ))}
            </TabsList>

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
