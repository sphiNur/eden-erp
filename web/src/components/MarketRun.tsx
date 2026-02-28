import { useEffect } from 'react';
import { mainButton } from '@telegram-apps/sdk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MarketRunProvider, useMarketRunContext } from '../contexts/MarketRunContext';
import { MarketHeader } from './market-run/MarketHeader';
import { MarketShoppingList } from './market-run/MarketShoppingList';
import { MarketDistributionList } from './market-run/MarketDistributionList';
import { PageLayout } from './layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

export const MarketRun = () => {
    return (
        <MarketRunProvider>
            <MarketRunContent />
        </MarketRunProvider>
    );
};

const MarketRunContent = () => {
    const { ui } = useLanguage();
    const { loading, viewMode, handleFinalize, items } = useMarketRunContext();

    const boughtCount = items.filter(i => i.status === 'bought').length;

    useEffect(() => {
        if (mainButton.mount.isAvailable()) {
            try { mainButton.mount(); } catch { /* noop */ }
        }

        if (boughtCount > 0) {
            try {
                mainButton.setParams({
                    text: `${ui('finalizeBatch')} (${boughtCount})`,
                    isVisible: true,
                    isEnabled: true,
                });
            } catch { /* noop */ }
        } else {
            try {
                mainButton.setParams({ isVisible: false });
            } catch { /* noop */ }
        }

        const handler = () => handleFinalize();
        try { mainButton.onClick(handler); } catch { /* noop */ }

        return () => {
            try { mainButton.offClick(handler); } catch { /* noop */ }
            try { mainButton.setParams({ isVisible: false }); } catch { /* noop */ }
        };
    }, [boughtCount, handleFinalize, ui]);

    const header = <MarketHeader />;

    return (
        <PageLayout header={header} className="bg-secondary">
            {loading ? (
                <div className="space-y-4 p-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <p className="text-sm font-medium">{ui('noItemsFound')}</p>
                </div>
            ) : viewMode === 'shopping' ? (
                <MarketShoppingList />
            ) : (
                <MarketDistributionList />
            )}
        </PageLayout>
    );
};
