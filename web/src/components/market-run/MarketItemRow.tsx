import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Badge } from '../ui/badge';
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
                "px-3 py-2 flex flex-col gap-1.5 transition-colors",
                item.status === 'bought' ? "bg-emerald-50/50" : "hover:bg-gray-50"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2" onClick={() => onToggleBreakdown(item.product_id)}>
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className={cn(
                            "font-semibold text-[13px] truncate text-gray-900",
                            item.status === 'bought' && "text-emerald-800 opacity-60 line-through"
                        )}>
                            {t(item.product_name)}
                        </div>
                        <Badge variant={item.status === 'bought' ? "secondary" : "outline"} className="shrink-0 h-4 px-1 text-[9px] font-mono">
                            {item.total_quantity_needed} {t(item.unit)}
                        </Badge>
                    </div>

                    {/* Breakdown Summary */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        {item.breakdown.length} stores
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </div>
                </div>

                <Checkbox
                    checked={item.status === 'bought'}
                    onCheckedChange={(c) => onToggleBought(item.product_id, c as boolean)}
                    className="h-8 w-8 rounded-full data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all shrink-0 mt-1"
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
                        <div className="bg-gray-50 rounded p-2 text-xs space-y-1 mb-2">
                            {item.breakdown.map((b, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span className="text-gray-600">{b.store_name}</span>
                                    <span className="font-mono font-medium">{b.quantity} {t(item.unit)}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inputs */}
            <AnimatePresence>
                {item.status !== 'bought' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-2 gap-1.5 mt-0.5"
                    >
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ui('qty')}</span>
                            <Input
                                type="number"
                                placeholder={item.total_quantity_needed.toString()}
                                className="h-10 pt-3.5 text-right font-mono font-bold text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                value={qtyInputValue}
                                onChange={(e) => onQtyChange(item.product_id, e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ui('totalCost')}</span>
                            <Input
                                type="number"
                                placeholder="0"
                                className="h-10 pt-3.5 text-right font-mono font-bold text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                value={priceInputValue}
                                onChange={(e) => onPriceChange(item.product_id, e.target.value)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {(unitPrice > 0 && item.status !== 'bought') && (
                <div className="flex justify-end items-center gap-1 text-[10px] text-eden-500 font-medium">
                    <Calculator size={10} />
                    <span>~{unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} UZS / {t(item.unit)}</span>
                </div>
            )}
        </motion.div>
    );
});
