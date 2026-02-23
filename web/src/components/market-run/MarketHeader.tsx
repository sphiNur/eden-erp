import { ShoppingCart, Store } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { PageHeader } from '../layout/PageHeader';

export const MarketHeader = () => {
    const { ui } = useLanguage();
    const { items, viewMode, setViewMode, estimatedTotal } = useMarketRunContext();

    return (
        <PageHeader>
            <div className="flex bg-accent/50 p-1 rounded-xl mb-2">
                <button
                    onClick={() => setViewMode('shopping')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'shopping'
                            ? "bg-card text-primary shadow-sm ring-1 ring-border"
                            : "bg-transparent text-muted-foreground hover:bg-accent"
                    )}
                    aria-label={ui('marketRun')}
                    aria-pressed={viewMode === 'shopping'}
                >
                    <ShoppingCart size={14} className={viewMode === 'shopping' ? "text-primary" : "text-muted-foreground"} />
                    Shopping
                </button>
                <button
                    onClick={() => setViewMode('distribution')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'distribution'
                            ? "bg-card text-blue-500 shadow-sm ring-1 ring-border"
                            : "bg-transparent text-muted-foreground hover:bg-accent"
                    )}
                    aria-label="Distribution View"
                    aria-pressed={viewMode === 'distribution'}
                >
                    <Store size={14} className={viewMode === 'distribution' ? "text-blue-500" : "text-muted-foreground"} />
                    Distribution
                </button>
            </div>

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
