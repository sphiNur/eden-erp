import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { ShoppingBag } from 'lucide-react';
import { MarketItemRow } from './MarketItemRow';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';

export const MarketShoppingList = () => {
    const { ui } = useLanguage();
    const {
        shoppingSections,
        shoppingSectionKeys
    } = useMarketRunContext();

    if (shoppingSectionKeys.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                <p>{ui('noItemsFound')}</p>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 flex flex-col">
            <Tabs defaultValue={shoppingSectionKeys[0]} className="w-full flex-1 flex flex-col">
                {/* Category Bar */}
                <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b shadow-sm">
                    <TabsList className="w-full justify-start overflow-x-auto h-auto bg-transparent p-2 gap-2 scrollbar-hide py-2.5">
                        {shoppingSectionKeys.map(key => (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="shrink-0 flex-none h-9 px-4 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm data-[state=active]:bg-eden-600 data-[state=active]:text-white data-[state=active]:border-eden-600 data-[state=active]:shadow-md transition-all active:scale-95"
                            >
                                {key} <span className="ml-1 opacity-70 text-[10px]">({shoppingSections[key].length})</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="p-3 flex-1 relative z-0">
                    {shoppingSectionKeys.map(key => (
                        <TabsContent key={key} value={key} className="space-y-1 m-0 focus-visible:outline-none">
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                                {shoppingSections[key].map(item => (
                                    <MarketItemRow
                                        key={item.product_id}
                                        item={item}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div>
    );
};
