import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Store } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';

export const MarketDistributionList = () => {
    const { t } = useLanguage();
    const {
        distributionSections,
        storeKeys
    } = useMarketRunContext();

    if (storeKeys.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <Store size={48} className="mx-auto mb-4 opacity-50" />
                <p>No stores pending.</p>
            </div>
        );
    }

    return (
        <div className="bg-secondary flex-1 p-3">
            <Tabs defaultValue={storeKeys[0]} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto mb-3 bg-card p-1 rounded-xl shadow-sm border border-border h-auto scrollbar-hide">
                    {storeKeys.map(key => (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className="flex-1 min-w-[80px] text-[13px] font-semibold py-2 px-3 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all text-muted-foreground hover:text-foreground"
                        >
                            {key} <span className="ml-1.5 opacity-60 text-[10px] bg-card/50 px-1.5 py-0.5 rounded-full">{distributionSections[key].length}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {storeKeys.map(key => (
                    <TabsContent key={key} value={key} className="space-y-1.5 outline-none focus:outline-none focus-visible:outline-none">
                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border/50">
                            {distributionSections[key].map((entry, idx) => (
                                <div key={idx} className="px-4 py-3.5 flex items-center justify-between hover:bg-accent/50 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="font-bold text-[14px] text-foreground">{t(entry.item.product_name)}</div>
                                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{t(entry.item.category_name)}</div>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[13px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 shadow-sm rounded-md">
                                        {entry.qty} {t(entry.item.unit)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};
