import { memo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { MarketItem } from '../../hooks/useMarketRun';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarketRunContext } from '../../contexts/MarketRunContext';

interface MarketItemRowProps {
    item: MarketItem;
}

export const MarketItemRow = memo(({ item }: MarketItemRowProps) => {
    const { t, ui } = useLanguage();
    const {
        getPriceInput,
        getUnitPriceInput,
        setPriceInput,
        setUnitPriceInput,
        expandedBreakdown,
        updateStoreQuantity,
        toggleBought,
        toggleBreakdown
    } = useMarketRunContext();

    const isExpanded = !!expandedBreakdown[item.product_id];
    const qtyNum = item.purchase_quantity || 0;

    // Local State for slick immediate rendering
    const [localTotal, setLocalTotal] = useState(() => getPriceInput(item.product_id));
    const [localUnit, setLocalUnit] = useState(() => getUnitPriceInput(item.product_id));

    // If context changed behind our back (e.g. stores qty changed recalculating total)
    // we could sync it, but usually user is typing here directly.

    const handleLocalUnitChange = (val: string) => {
        setLocalUnit(val);
        setUnitPriceInput(item.product_id, val);
        const unitNum = parseFloat(val);
        if (!isNaN(unitNum) && qtyNum > 0) {
            const newTotal = Math.round(unitNum * qtyNum).toString();
            setLocalTotal(newTotal);
            setPriceInput(item.product_id, newTotal);
        } else if (val === '') {
            setLocalTotal('');
            setPriceInput(item.product_id, '');
        }
    };

    const handleLocalTotalChange = (val: string) => {
        setLocalTotal(val);
        setPriceInput(item.product_id, val);
        const totalNum = parseFloat(val);
        if (!isNaN(totalNum) && qtyNum > 0) {
            const newUnit = Math.round(totalNum / qtyNum).toString();
            setLocalUnit(newUnit);
            setUnitPriceInput(item.product_id, newUnit);
        } else if (val === '') {
            setLocalUnit('');
            setUnitPriceInput(item.product_id, '');
        }
    };

    return (
        <div className={cn(
            "px-3 py-3 flex flex-col gap-2.5 transition-colors border-b last:border-0",
            item.status === 'bought' ? "bg-emerald-50/30" : "bg-white"
        )}>
            {/* 1. Header Row (Name, Qty, Tick) */}
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    className="flex-1 min-w-0 text-left focus:outline-none rounded-md"
                    onClick={() => toggleBreakdown(item.product_id)}
                    aria-expanded={isExpanded}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className={cn(
                            "font-bold text-[14px] leading-tight text-gray-900 line-clamp-2 pr-2",
                            item.status === 'bought' && "text-emerald-700 line-through"
                        )}>
                            {t(item.product_name)}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                {qtyNum} {t(item.unit)}
                            </span>
                            {item.breakdown.length > 0 && (
                                <div className="flex items-center gap-0.5 text-[10px] font-bold text-eden-700 bg-eden-50 px-1.5 py-0.5 rounded-full border border-eden-200">
                                    {item.breakdown.length} {ui('stores')}
                                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </div>
                            )}
                        </div>
                    </div>
                </button>

                <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                    <Checkbox
                        checked={item.status === 'bought'}
                        onCheckedChange={(c) => toggleBought(item.product_id, c as boolean)}
                        className="h-6 w-6 rounded-full border-2 border-gray-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all"
                        aria-label={t(item.product_name)}
                    />
                </div>
            </div>

            {/* 2. Breakdown stores (Hidden by default) */}
            <div className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}>
                <div className="overflow-hidden">
                    <div className="bg-gray-50/80 rounded-lg p-2 space-y-1.5 mb-1 mt-1 border border-gray-100">
                        {item.breakdown.map((b, idx) => (
                            <div key={idx} className="flex justify-between items-center gap-2">
                                <span className="text-gray-700 font-medium text-[11px] flex-1 truncate">{b.store_name}</span>
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        className="h-6 w-16 text-right text-[11px] font-mono font-bold bg-white border-gray-200 focus:border-eden-500 px-1 placeholder:font-normal placeholder:text-gray-300"
                                        value={b.quantity}
                                        onChange={(e) => {
                                            updateStoreQuantity(item.product_id, b.store_name, e.target.value);
                                            // Optional: If they change store qty, you might want to recalculate localTotal dynamically here 
                                            // But for now it's calculated in the hook and you can sync it down later if needed.
                                            // To keep it simple, we just assume they type total price at the end.
                                            setTimeout(() => {
                                                setLocalTotal(getPriceInput(item.product_id));
                                            }, 50);
                                        }}
                                    />
                                    <span className="text-[10px] text-gray-400 font-medium w-5">{t(item.unit)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Inputs Row (Only if not bought) */}
            <div className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                item.status !== 'bought' ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}>
                <div className="overflow-hidden">
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-50 border-dashed mt-1">
                        <div className="flex-1 flex items-center bg-gray-50 rounded-lg focus-within:ring-1 focus-within:ring-eden-500 overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-400 pl-2 pr-1 uppercase select-none w-10">{ui('unitPrice') || 'UNIT'}</span>
                            <input
                                type="number"
                                placeholder="..."
                                className="flex-1 h-8 bg-transparent text-right font-mono font-bold text-[13px] outline-none pr-2"
                                value={localUnit}
                                onChange={(e) => handleLocalUnitChange(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 flex items-center bg-gray-50 rounded-lg focus-within:ring-1 focus-within:ring-eden-500 overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-400 pl-2 pr-1 uppercase select-none w-12">{ui('totalCost') || 'TOTAL'}</span>
                            <input
                                type="number"
                                placeholder="..."
                                className="flex-1 h-8 bg-transparent text-right font-mono font-bold text-[13px] outline-none pr-2"
                                value={localTotal}
                                onChange={(e) => handleLocalTotalChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
