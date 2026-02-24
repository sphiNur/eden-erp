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
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const bottomBar = viewMode === 'shopping' ? (
        <div className="p-3 bg-card border-t border-border shadow-md">
            <Button
                size="lg"
                onClick={handleFinalize}
                className="w-full text-base font-bold py-6 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
                {ui('finalizeBatch')}
            </Button>
        </div>
    ) : undefined;

    return (
        <PageLayout
            header={<MarketHeader />}
            bottomBar={bottomBar}
            className="bg-secondary h-full flex flex-col"
            noPadding
        >
            <div className="flex-1 w-full relative">
                {viewMode === 'shopping' ? (
                    <MarketShoppingList />
                ) : (
                    <MarketDistributionList />
                )}
            </div>
        </PageLayout>
    );
};
