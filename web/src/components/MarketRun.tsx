import { ShoppingCart, Store, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { useMarketRun } from '../hooks/useMarketRun';
import { MarketShoppingList } from './market-run/MarketShoppingList';
import { MarketDistributionList } from './market-run/MarketDistributionList';
import { PageLayout } from './layout/PageLayout';

export const MarketRun = () => {
    const { ui } = useLanguage();
    const {
        items,
        loading,
        priceInputs,
        qtyInputs,
        viewMode,
        expandedBreakdown,
        shoppingSections,
        shoppingSectionKeys,
        distributionSections,
        storeKeys,
        setViewMode,
        handlePriceChange,
        handleQtyChange,
        toggleBought,
        toggleBreakdown,
        handleFinalize
    } = useMarketRun();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-eden-500" size={48} />
            </div>
        );
    }

    const toolbar = (
        <div className="pt-2 pb-2 px-3">
            <div className="flex bg-gray-100/80 p-1 rounded-xl">
                <button
                    onClick={() => setViewMode('shopping')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'shopping'
                            ? "bg-eden-50 text-eden-600 ring-1 ring-inset ring-eden-200"
                            : "bg-transparent text-gray-500 hover:bg-gray-100"
                    )}
                >
                    <ShoppingCart size={14} className={viewMode === 'shopping' ? "text-eden-600" : "text-gray-400"} />
                    Shopping
                </button>
                <button
                    onClick={() => setViewMode('distribution')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'distribution'
                            ? "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200"
                            : "bg-transparent text-gray-500 hover:bg-gray-100"
                    )}
                >
                    <Store size={14} className={viewMode === 'distribution' ? "text-blue-600" : "text-gray-400"} />
                    Distribution
                </button>
            </div>

            {viewMode === 'shopping' && (
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span>{items.filter(i => i.status === 'bought').length} / {items.length} {ui('done')}</span>
                </div>
            )}
        </div>
    );

    return (
        <PageLayout
            toolbar={toolbar}
            className="bg-[var(--tg-theme-bg-color,#f3f4f6)]"
        >
            {viewMode === 'shopping' ? (
                <MarketShoppingList
                    shoppingSections={shoppingSections}
                    shoppingSectionKeys={shoppingSectionKeys}
                    priceInputs={priceInputs}
                    qtyInputs={qtyInputs}
                    expandedBreakdown={expandedBreakdown}
                    onPriceChange={handlePriceChange}
                    onQtyChange={handleQtyChange}
                    onToggleBought={toggleBought}
                    onToggleBreakdown={toggleBreakdown}
                />
            ) : (
                <MarketDistributionList
                    distributionSections={distributionSections}
                    storeKeys={storeKeys}
                />
            )}

            {/* Sticky Footer - ONLY IN SHOPPING MODE */}
            {viewMode === 'shopping' && (
                <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-lg border-t z-drawer">
                    <Button
                        size="lg"
                        onClick={handleFinalize}
                        className="w-full text-base font-bold py-4 rounded-xl shadow-xl shadow-eden-500/20 active:scale-[0.98] transition-transform"
                    >
                        {ui('finalizeBatch')}
                    </Button>
                </div>
            )}
        </PageLayout>
    );
};
