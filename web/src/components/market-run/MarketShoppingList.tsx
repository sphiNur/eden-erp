import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { MarketItemRow } from './MarketItemRow';

export const MarketShoppingList = () => {
    const { shoppingSections, shoppingSectionKeys } = useMarketRunContext();

    return (
        <div className="space-y-3 pb-24">
            {shoppingSectionKeys.map(category => {
                const items = shoppingSections[category];
                return (
                    <div key={category} className="space-y-1">
                        <h3 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider px-1 py-0.5">
                            {category}
                        </h3>
                        <div className="bg-card rounded-lg border border-border overflow-hidden divide-y divide-border">
                            {items.map(item => (
                                <MarketItemRow key={item.product_id} item={item} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
