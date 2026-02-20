import { ShoppingCart, Store } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { PageHeader } from '../layout/PageHeader';

export const MarketHeader = () => {
    const { ui } = useLanguage();
    const { items, viewMode, setViewMode } = useMarketRunContext();

    return (
        <PageHeader>
            <div className="flex bg-gray-100/80 p-1 rounded-xl mb-2">
                <button
                    onClick={() => setViewMode('shopping')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'shopping'
                            ? "bg-white text-eden-600 shadow-sm"
                            : "bg-transparent text-gray-500 hover:bg-gray-200/50"
                    )}
                    aria-label={ui('marketRun')}
                    aria-pressed={viewMode === 'shopping'}
                >
                    <ShoppingCart size={14} className={viewMode === 'shopping' ? "text-eden-600" : "text-gray-400"} />
                    Shopping
                </button>
                <button
                    onClick={() => setViewMode('distribution')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'distribution'
                            ? "bg-white text-blue-600 shadow-sm"
                            : "bg-transparent text-gray-500 hover:bg-gray-200/50"
                    )}
                    aria-label="Distribution View"
                    aria-pressed={viewMode === 'distribution'}
                >
                    <Store size={14} className={viewMode === 'distribution' ? "text-blue-600" : "text-gray-400"} />
                    Distribution
                </button>
            </div>

            {viewMode === 'shopping' && (
                <div className="text-xs font-medium text-gray-500 flex justify-between px-1">
                    <span>{ui('progress')}: {items.filter(i => i.status === 'bought').length} / {items.length}</span>
                </div>
            )}
        </PageHeader>
    );
};
