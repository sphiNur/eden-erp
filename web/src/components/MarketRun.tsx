import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { MarketRunProvider, useMarketRunContext } from '../contexts/MarketRunContext';
import { MarketShoppingList } from './market-run/MarketShoppingList';
import { MarketDistributionList } from './market-run/MarketDistributionList';
import { MarketHeader } from './market-run/MarketHeader';
import { PageLayout } from './layout/PageLayout';
import { mainButton } from '@telegram-apps/sdk-react';

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

    // Telegram MainButton Integration
    useEffect(() => {
        if (loading) return;

        if (mainButton.isMounted()) {
            if (viewMode === 'shopping') {
                mainButton.setParams({
                    text: ui('finalizeBatch'),
                    isVisible: true,
                    isEnabled: true,
                });

                const onClick = () => handleFinalize();
                mainButton.onClick(onClick);

                return () => {
                    mainButton.offClick(onClick);
                };
            } else {
                mainButton.setParams({ isVisible: false });
            }
        }
    }, [viewMode, loading, ui, handleFinalize]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const isTgMainButtonAvailable = mainButton.isMounted();

    const bottomBar = (!isTgMainButtonAvailable && viewMode === 'shopping') ? (
        <div className="p-4 bg-card border-t border-border shadow-md pb-safe">
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
