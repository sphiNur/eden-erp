import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { MarketItem } from '../../hooks/useMarketRun';
import { useLanguage } from '../../contexts/LanguageContext';

interface MarketItemRowProps {
    item: MarketItem;
    priceInputValue: string;
    qtyInputValue: string;
    isExpanded: boolean;
    onPriceChange: (id: string, val: string) => void;
    onQtyChange: (id: string, val: string) => void;
    onToggleBought: (id: string, checked: boolean) => void;
    onToggleBreakdown: (id: string) => void;
}

export const MarketItemRow = memo(({
    item,
    priceInputValue,
    qtyInputValue,
    isExpanded,
    onPriceChange,
    onQtyChange,
    onToggleBought,
    onToggleBreakdown
}: MarketItemRowProps) => {
    const { t, ui } = useLanguage();

    // Derived values
    const priceNum = parseFloat(priceInputValue);
    const qtyNum = parseFloat(qtyInputValue || item.total_quantity_needed.toString());
    const unitPrice = (priceNum && qtyNum) ? (priceNum / qtyNum) : 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
                "px-4 py-3 flex flex-col gap-3 transition-colors border-b last:border-0",
                item.status === 'bought' ? "bg-emerald-50/30" : "bg-white"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Product Info */}
                <div className="flex-1 min-w-0 pt-0.5" onClick={() => onToggleBreakdown(item.product_id)}>
                    <div className="flex flex-col gap-0.5">
                        <div className={cn(
                            "font-bold text-[15px] leading-tight text-gray-900",
                            item.status === 'bought' && "text-emerald-800 opacity-60 line-through"
                        )}>
                            {t(item.product_name)}
                        </div>
                        {/* Unit Info Row */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">
                                {item.total_quantity_needed} {t(item.unit)} needed
                            </span>

                            {/* Store Count Badge */}
                            {item.breakdown.length > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-semibold text-gray-600">
                                    {item.breakdown.length} stores
                                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Checkbox */}
                <Checkbox
                    checked={item.status === 'bought'}
                    onCheckedChange={(c) => onToggleBought(item.product_id, c as boolean)}
                    className="h-7 w-7 rounded-full border-2 border-gray-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all shrink-0 mt-0.5"
                />
            </div>

            {/* Detailed Breakdown */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gray-50/80 rounded-lg p-2.5 text-xs space-y-1.5 mb-1 mt-1 border border-gray-100">
                            {item.breakdown.map((b, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">{b.store_name}</span>
                                    <span className="font-mono font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm">
                                        {b.quantity} {t(item.unit)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inputs Section */}
            <AnimatePresence>
                {item.status !== 'bought' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-2 gap-3 pt-1"
                    >
                        <div className="relative">
                            <label className="absolute left-3 top-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{ui('qty')}</label>
                            <Input
                                type="number"
                                placeholder={item.total_quantity_needed.toString()}
                                className="h-12 pt-4 text-right font-mono font-bold text-base bg-gray-50 border-transparent focus:bg-white focus:border-eden-500 transition-all rounded-xl"
                                value={qtyInputValue}
                                onChange={(e) => onQtyChange(item.product_id, e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <label className="absolute left-3 top-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{ui('totalCost')}</label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="h-12 pt-4 text-right font-mono font-bold text-base bg-gray-50 border-transparent focus:bg-white focus:border-eden-500 transition-all rounded-xl"
                                value={priceInputValue}
                                onChange={(e) => onPriceChange(item.product_id, e.target.value)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Unit Price Calculation */}
            {(unitPrice > 0 && item.status !== 'bought') && (
                <div className="flex justify-end items-center gap-1.5 text-[11px] text-eden-600 font-semibold bg-eden-50/50 py-1 px-2 rounded-md self-end">
                    <Calculator size={11} />
                    <span>~{unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} UZS / {t(item.unit)}</span>
                </div>
            )}
        </motion.div>
    );
});
