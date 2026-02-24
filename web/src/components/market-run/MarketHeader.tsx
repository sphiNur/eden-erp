import { type ReactNode } from 'react';
import { ShoppingCart, Store } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { PageHeader } from '../layout/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ViewMode } from '../../hooks/useMarketRun';

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: ReactNode }[] = [
    { value: 'shopping', label: 'Shopping', icon: <ShoppingCart size={14} aria-hidden /> },
    { value: 'distribution', label: 'Distribution', icon: <Store size={14} aria-hidden /> },
];

export const MarketHeader = () => {
    const { ui } = useLanguage();
    const { items, viewMode, setViewMode, estimatedTotal } = useMarketRunContext();

    return (
        <PageHeader>
            <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as ViewMode)} className="mb-2 w-full">
                <TabsList className="grid w-full grid-cols-2">
                    {VIEW_OPTIONS.map(opt => (
                        <TabsTrigger key={opt.value} value={opt.value} className="flex items-center gap-2 text-xs">
                            {opt.icon}
                            {opt.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {viewMode === 'shopping' && (
                <div className="flex justify-between items-end px-1 mt-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Budget</span>
                        <span className="text-lg font-black text-foreground">
                            {estimatedTotal > 0 ? `${estimatedTotal.toLocaleString('en-US')} UZS` : '---'}
                        </span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground mb-1">
                        {ui('progress')}: <span className="text-foreground">{items.filter(i => i.status === 'bought').length}</span> / {items.length}
                    </span>
                </div>
            )}
        </PageHeader>
    );
};
