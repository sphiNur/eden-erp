import { ShoppingCart, Store, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { MarketRunProvider, useMarketRunContext } from '../contexts/MarketRunContext';
import { MarketShoppingList } from './market-run/MarketShoppingList';
import { MarketDistributionList } from './market-run/MarketDistributionList';
import { PageLayout } from './layout/PageLayout';
import { PageHeader } from './layout/PageHeader';

export const MarketRun = () => {
    return (
        <MarketRunProvider>
            <MarketRunContent />
        </MarketRunProvider>
    );
};

const MarketRunContent = () => {
    const { ui } = useLanguage();
    const {
        items,
        loading,
        viewMode,
        setViewMode,
        handleFinalize
    } = useMarketRunContext();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-eden-500" size={48} />
            </div>
        );
    }

    const header = (
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

    const bottomBar = viewMode === 'shopping' ? (
        <div className="p-3 pb-safe">
            <Button
                size="lg"
                onClick={handleFinalize}
                className="w-full text-base font-bold py-6 rounded-xl shadow-xl shadow-eden-500/20 active:scale-[0.98] transition-transform"
            >
                {ui('finalizeBatch')}
            </Button>
        </div>
    ) : undefined;

    return (
        <PageLayout
            header={header}
            bottomBar={bottomBar}
            className="bg-[var(--tg-theme-bg-color,#f3f4f6)] min-h-[100dvh] flex flex-col"
        >
            <div className="flex-1">
                {viewMode === 'shopping' ? (
                    <MarketShoppingList />
                ) : (
                    <MarketDistributionList />
                )}
            </div>
        </PageLayout>
    );
};
