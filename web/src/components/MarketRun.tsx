import { ShoppingCart, Store, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { useMarketRun } from '../hooks/useMarketRun';
import { MarketShoppingList } from './market-run/MarketShoppingList';
import { MarketDistributionList } from './market-run/MarketDistributionList';
import { PageLayout } from './layout/PageLayout';
import { PageHeader } from './layout/PageHeader';

export const MarketRun = () => {
    const { ui } = useLanguage();
    const {
        items,
        loading,
        priceInputs,
        unitPriceInputs,
        viewMode,
        expandedBreakdown,
        shoppingSections,
        shoppingSectionKeys,
        distributionSections,
        storeKeys,
        setViewMode,
        handleTotalPriceChange,
        handleUnitPriceChange,
        updateStoreQuantity,
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

    // ... inside component

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

    return (
        <PageLayout
            header={header}
            className="bg-[var(--tg-theme-bg-color,#f3f4f6)]"
        >
            {viewMode === 'shopping' ? (
                <MarketShoppingList
                    shoppingSections={shoppingSections}
                    shoppingSectionKeys={shoppingSectionKeys}
                    priceInputs={priceInputs}
                    unitPriceInputs={unitPriceInputs}
                    expandedBreakdown={expandedBreakdown}
                    onTotalPriceChange={handleTotalPriceChange}
                    onUnitPriceChange={handleUnitPriceChange}
                    onStoreQtyChange={updateStoreQuantity}
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
                <div className="fixed bottom-0 left-0 right-0 p-3 pb-safe bg-white/90 backdrop-blur-lg border-t z-drawer">
                    <Button
                        size="lg"
                        onClick={handleFinalize}
                        className="w-full text-base font-bold py-4 rounded-xl shadow-xl shadow-eden-500/20 active:scale-[0.98] transition-transform mb-2"
                    >
                        {ui('finalizeBatch')}
                    </Button>
                </div>
            )}
        </PageLayout>
    );
};
