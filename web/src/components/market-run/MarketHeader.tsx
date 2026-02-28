import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { ShoppingCart, Truck } from 'lucide-react';
import { haptic } from '../../lib/telegram';

export const MarketHeader = () => {
    const { ui } = useLanguage();
    const { viewMode, setViewMode, items, estimatedTotal } = useMarketRunContext();
    const boughtCount = items.filter(i => i.status === 'bought').length;

    return (
        <div className="w-full">
            {/* Summary and Tab Row */}
            <div className="flex items-center justify-between px-4 py-3">
                <div>
                    <h1 className="text-lg font-bold text-foreground">{ui('marketRun')}</h1>
                    <p className="text-xs text-muted-foreground">
                        {items.length} items · {boughtCount} bought
                        {estimatedTotal > 0 && ` · ~${estimatedTotal.toLocaleString()} UZS`}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    type="button"
                    onClick={() => { haptic.selection(); setViewMode('shopping'); }}
                    className={cn(
                        "flex-1 py-2 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors border-b-2",
                        viewMode === 'shopping'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <ShoppingCart size={14} />
                    Shopping
                </button>
                <button
                    type="button"
                    onClick={() => { haptic.selection(); setViewMode('distribution'); }}
                    className={cn(
                        "flex-1 py-2 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors border-b-2",
                        viewMode === 'distribution'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Truck size={14} />
                    Distribution
                </button>
            </div>
        </div>
    );
};
