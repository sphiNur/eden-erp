import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const MarketDistributionList = () => {
    const { t } = useLanguage();
    const { distributionSections, storeKeys } = useMarketRunContext();

    return (
        <div className="space-y-3 pb-24">
            {storeKeys.map(storeName => {
                const entries = distributionSections[storeName];
                return (
                    <div key={storeName} className="space-y-1">
                        <h3 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider px-1 py-0.5">
                            {storeName}
                        </h3>
                        <div className="bg-card rounded-lg border border-border overflow-hidden divide-y divide-border">
                            {entries.map(({ item, qty }) => (
                                <div
                                    key={`${storeName}-${item.product_id}`}
                                    className="px-3 py-2.5 flex items-center justify-between"
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        {t(item.product_name)}
                                    </span>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-foreground">{qty}</span>
                                        <span className="text-xs text-muted-foreground ml-1">{t(item.unit)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
