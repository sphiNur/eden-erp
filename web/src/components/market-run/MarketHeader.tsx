import { type ReactNode } from 'react';
import { ShoppingCart, Store } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { PageHeader } from '../layout/PageHeader';
import { SegmentControl } from '../ui/segment-control';
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
            <SegmentControl<ViewMode>
                options={VIEW_OPTIONS}
                value={viewMode}
                onChange={setViewMode}
                className="mb-2"
                aria-label={ui('marketRun')}
            />

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
