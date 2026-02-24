import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Store, Share, Building } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { useState } from 'react';
import { tgAlert } from '../../lib/telegram';

export const MarketDistributionList = () => {
    const { t } = useLanguage();
    const {
        distributionSections,
        storeKeys,
        stallSections,
        stallKeys
    } = useMarketRunContext();

    const [subView, setSubView] = useState<'store' | 'vendor'>('store');

    if (storeKeys.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <Store size={48} className="mx-auto mb-4 opacity-50" />
                <p>No stores pending.</p>
            </div>
        );
    }

    const handleShare = (vendorName: string) => {
        const items = stallSections[vendorName];
        if (!items || items.length === 0) return;

        let text = `📦 Pre-Order: ${vendorName}\n`;
        text += `Date: ${new Date().toLocaleDateString()}\n\n`;

        items.forEach(item => {
            text += `• ${t(item.product_name)} - ${item.total_quantity_needed} ${t(item.unit)}\n`;
        });

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                tgAlert('Order list copied to clipboard!');
            }).catch(err => {
                console.error('Clipboard error:', err);
                tgAlert('Failed to copy. Please manually select and copy text.');
            });
        }
    };

    return (
        <div className="bg-secondary flex-1 p-3 flex flex-col h-full">
            <div className="flex bg-accent/50 p-1 rounded-xl mb-3 shrink-0">
                <button
                    onClick={() => setSubView('store')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${subView === 'store' ? 'bg-card text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:bg-accent'}`}
                >
                    <Building size={14} /> By Store
                </button>
                <button
                    onClick={() => setSubView('vendor')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${subView === 'vendor' ? 'bg-card text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:bg-accent'}`}
                >
                    <Store size={14} /> By Vendor
                </button>
            </div>

            {subView === 'store' && (
                <Tabs defaultValue={storeKeys[0]} className="w-full flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-full justify-start overflow-x-auto mb-3 bg-card p-1 rounded-xl shadow-sm border border-border shrink-0 scrollbar-hide">
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

                    <div className="flex-1 overflow-y-auto">
                        {storeKeys.map(key => (
                            <TabsContent key={key} value={key} className="space-y-1.5 mt-0 outline-none focus:outline-none focus-visible:outline-none">
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
                    </div>
                </Tabs>
            )}

            {subView === 'vendor' && (
                <Tabs defaultValue={stallKeys[0]} className="w-full flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-full justify-start overflow-x-auto mb-3 bg-card p-1 rounded-xl shadow-sm border border-border shrink-0 scrollbar-hide">
                        {stallKeys.map(key => (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="flex-1 min-w-[80px] text-[13px] font-semibold py-2 px-3 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all text-muted-foreground hover:text-foreground"
                            >
                                {key} <span className="ml-1.5 opacity-60 text-[10px] bg-card/50 px-1.5 py-0.5 rounded-full">{stallSections[key].length}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex-1 overflow-y-auto">
                        {stallKeys.map(key => (
                            <TabsContent key={key} value={key} className="space-y-3 mt-0 outline-none focus:outline-none focus-visible:outline-none">
                                <button
                                    onClick={() => handleShare(key)}
                                    className="w-full bg-primary/10 text-primary border border-primary/20 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/20 active:scale-[0.98] transition-all shadow-sm"
                                >
                                    <Share size={16} />
                                    Copy List to Clipboard
                                </button>

                                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border/50">
                                    {stallSections[key].map((item, idx) => (
                                        <div key={idx} className="px-4 py-3.5 flex items-center justify-between hover:bg-accent/50 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="font-bold text-[14px] text-foreground">{t(item.product_name)}</div>
                                                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Qty Needed</div>
                                            </div>
                                            <Badge variant="outline" className="font-mono text-[13px] px-2 py-0.5 bg-secondary text-foreground shadow-sm rounded-md">
                                                {item.total_quantity_needed} {t(item.unit)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            )}
        </div>
    );
};
