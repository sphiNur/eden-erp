import { useMarketData, MarketItem } from './useMarketData';
import { useMarketUI, ViewMode } from './useMarketUI';

export type { MarketItem, ViewMode };

export const useMarketRun = () => {
    const data = useMarketData();
    const ui = useMarketUI(data.items);

    return {
        ...data,
        ...ui
    };
};
