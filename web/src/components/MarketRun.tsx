import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { MarketRunProvider, useMarketRunContext } from '../contexts/MarketRunContext';
import { MarketShoppingList } from './market-run/MarketShoppingList';
import { MarketDistributionList } from './market-run/MarketDistributionList';
import { MarketHeader } from './market-run/MarketHeader';
import { PageLayout } from './layout/PageLayout';

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
        loading,
        viewMode,
        handleFinalize
    } = useMarketRunContext();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-eden-500" size={48} />
            </div>
        );
    }

    const bottomBar = viewMode === 'shopping' ? (
        <div className="p-3 pb-safe bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
            header={<MarketHeader />}
            bottomBar={bottomBar}
            className="bg-gray-50 min-h-[100dvh] flex flex-col"
            noPadding
        >
            <div className="flex-1 w-full h-full">
                {viewMode === 'shopping' ? (
                    <MarketShoppingList />
                ) : (
                    <MarketDistributionList />
                )}
            </div>
        </PageLayout>
    );
};
