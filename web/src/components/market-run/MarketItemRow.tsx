import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';
import { Input } from '@/components/ui/input';
import { cn } from '../../lib/utils';
import type { MarketItem } from '../../hooks/useMarketData';
import { haptic } from '../../lib/telegram';

interface MarketItemRowProps {
    item: MarketItem;
}

export const MarketItemRow = ({ item }: MarketItemRowProps) => {
    const { t, ui } = useLanguage();
    const {
        toggleBought,
        expandedBreakdown,
        toggleBreakdown,
        getPriceInput,
        getUnitPriceInput,
        setPriceInput,
        setUnitPriceInput,
        updateStoreQuantity
    } = useMarketRunContext();

    const [localPrice, setLocalPrice] = useState(() => getPriceInput(item.product_id));
    const [localUnitPrice, setLocalUnitPrice] = useState(() => getUnitPriceInput(item.product_id));

    const isBought = item.status === 'bought';
    const isExpanded = expandedBreakdown[item.product_id];
    const name = t(item.product_name);
    const unit = t(item.unit);

    const handlePriceChange = useCallback((val: string) => {
        setLocalPrice(val);
        setPriceInput(item.product_id, val);

        const numVal = parseFloat(val);
        const quantity = item.purchase_quantity || item.total_quantity_needed;
        if (!isNaN(numVal) && numVal > 0 && quantity > 0) {
            const unitP = Math.round(numVal / quantity).toString();
            setLocalUnitPrice(unitP);
            setUnitPriceInput(item.product_id, unitP);
        }
    }, [item.product_id, item.purchase_quantity, item.total_quantity_needed, setPriceInput, setUnitPriceInput]);

    const handleUnitPriceChange = useCallback((val: string) => {
        setLocalUnitPrice(val);
        setUnitPriceInput(item.product_id, val);

        const numVal = parseFloat(val);
        const quantity = item.purchase_quantity || item.total_quantity_needed;
        if (!isNaN(numVal) && numVal > 0) {
            const totalP = Math.round(numVal * quantity).toString();
            setLocalPrice(totalP);
            setPriceInput(item.product_id, totalP);
        }
    }, [item.product_id, item.purchase_quantity, item.total_quantity_needed, setPriceInput, setUnitPriceInput]);

    return (
        <div className={cn("transition-colors", isBought && "bg-primary/[0.03]")}>
            <div className="px-3 py-2.5 flex items-center gap-3">
                {/* Checkbox */}
                <button
                    type="button"
                    onClick={() => toggleBought(item.product_id, !isBought)}
                    className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        isBought
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                    )}
                >
                    {isBought && <Check size={12} strokeWidth={3} />}
                </button>

                {/* Name & info */}
                <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-semibold truncate", isBought ? "text-foreground" : "text-foreground")}>
                        {name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        {item.purchase_quantity ?? item.total_quantity_needed} {unit}
                        {item.price_reference ? ` · ~${item.price_reference.toLocaleString()}` : ''}
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    type="button"
                    onClick={() => {
                        haptic.selection();
                        toggleBreakdown(item.product_id);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Expanded: price inputs + breakdown */}
            {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-border mx-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">{ui('totalCost')}</label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                className="h-8 bg-accent border-none text-xs font-mono"
                                value={localPrice}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">{ui('unitPrice')}</label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                className="h-8 bg-accent border-none text-xs font-mono"
                                value={localUnitPrice}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitPriceChange(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Store breakdown */}
                    {item.breakdown.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Breakdown</span>
                            {item.breakdown.map(b => (
                                <div key={b.store_name} className="flex items-center gap-2 text-xs">
                                    <span className="text-foreground flex-1 truncate">{b.store_name}</span>
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        className="h-7 w-16 bg-accent border-none text-xs font-mono text-right"
                                        defaultValue={b.quantity}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            updateStoreQuantity(item.product_id, b.store_name, e.target.value)
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
