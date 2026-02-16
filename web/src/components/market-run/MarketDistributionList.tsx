import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Store } from 'lucide-react';
import { Badge } from '../ui/badge';
import { MarketItem } from '../../hooks/useMarketRun';
import { useLanguage } from '../../contexts/LanguageContext';

interface MarketDistributionListProps {
    distributionSections: Record<string, { item: MarketItem, qty: number }[]>;
    storeKeys: string[];
}

export const MarketDistributionList = ({
    distributionSections,
    storeKeys
}: MarketDistributionListProps) => {
    const { t } = useLanguage();

    if (storeKeys.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <Store size={48} className="mx-auto mb-4 opacity-50" />
                <p>No stores pending.</p>
            </div>
        );
    }

    return (
        <Tabs defaultValue={storeKeys[0]} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto mb-2 bg-gray-100 p-0.5 rounded-lg h-auto scrollbar-hide">
                {storeKeys.map(key => (
                    <TabsTrigger
                        key={key}
                        value={key}
                        className="flex-1 min-w-[80px] text-xs py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-blue-600"
                    >
                        {key} [{distributionSections[key].length}]
                    </TabsTrigger>
                ))}
            </TabsList>

            {storeKeys.map(key => (
                <TabsContent key={key} value={key} className="space-y-1">
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                        {distributionSections[key].map((entry, idx) => (
                            <div key={idx} className="px-3 py-3 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-[13px] text-gray-900">{t(entry.item.product_name)}</div>
                                    <div className="text-[10px] text-gray-500">{t(entry.item.category_name)}</div>
                                </div>
                                <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-100">
                                    {entry.qty} {t(entry.item.unit)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    );
};
