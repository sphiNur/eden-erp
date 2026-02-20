import { createContext, useContext, ReactNode } from 'react';
import { useMarketRun } from '../hooks/useMarketRun';

type MarketRunContextType = ReturnType<typeof useMarketRun>;

const MarketRunContext = createContext<MarketRunContextType | null>(null);

export const MarketRunProvider = ({ children }: { children: ReactNode }) => {
    const marketRun = useMarketRun();

    return (
        <MarketRunContext.Provider value={marketRun}>
            {children}
        </MarketRunContext.Provider>
    );
};

export const useMarketRunContext = () => {
    const context = useContext(MarketRunContext);
    if (!context) {
        throw new Error('useMarketRunContext must be used within a MarketRunProvider');
    }
    return context;
};
