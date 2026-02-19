import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { MarketItem } from '../../hooks/useMarketRun';
import { useLanguage } from '../../contexts/LanguageContext';

interface MarketItemRowProps {
    item: MarketItem;
    priceInputValue: string;
    unitPriceInputValue: string;
    isExpanded: boolean;
    onTotalPriceChange: (id: string, val: string) => void;
    onUnitPriceChange: (id: string, val: string) => void;
    onStoreQtyChange: (id: string, storeName: string, val: string) => void;
    onToggleBought: (id: string, checked: boolean) => void;
    onToggleBreakdown: (id: string) => void;
}

export const MarketItemRow = memo(({
    item,
    priceInputValue,
    unitPriceInputValue,
    isExpanded,
    onTotalPriceChange,
    onUnitPriceChange,
    onStoreQtyChange,
    onToggleBought,
    onToggleBreakdown
}: MarketItemRowProps) => {
    const { t, ui } = useLanguage();

    // Derived values
    // Qty is now the 'purchase_quantity' from the item (sum of stores)
    const qtyNum = item.purchase_quantity || 0;

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
                {/* Product Info - Made Accessible */}
                <button
                    type="button"
                    className="flex-1 min-w-0 pt-0.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-eden-500 rounded-md"
                    onClick={() => onToggleBreakdown(item.product_id)}
                    aria-expanded={isExpanded}
                >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={cn(
                            "font-bold text-[15px] leading-tight text-gray-900",
                            item.status === 'bought' && "text-emerald-700 line-through"
                        )}>
                            {t(item.product_name)}
                        </span>

                        {/* Unit Info - Darker for contrast */}
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                            {qtyNum} {t(item.unit)}
                        </span>

                        {/* Store Count Badge */}
                        {item.breakdown.length > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] font-bold text-eden-700 bg-eden-50 px-1.5 py-0.5 rounded-full border border-eden-200">
                                {item.breakdown.length} {ui('stores')}
                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </div>
                        )}
                    </div>
                </button>

                {/* Action Checkbox - Stop Propagation */}
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={item.status === 'bought'}
                        onCheckedChange={(c) => onToggleBought(item.product_id, c as boolean)}
                        className="h-7 w-7 rounded-full border-2 border-gray-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all shrink-0 mt-0.5"
                        aria-label={t(item.product_name)}
                    />
                </div>
            </div>

            {/* Detailed Breakdown (Editable) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gray-50/80 rounded-lg p-2.5 space-y-2 mb-1 mt-1 border border-gray-100">
                            {item.breakdown.map((b, idx) => (
                                <div key={idx} className="flex justify-between items-center gap-2">
                                    <span className="text-gray-700 font-medium text-xs flex-1 truncate">{b.store_name}</span>
                                    {/* Editable Store Quantity */}
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            className="h-7 w-20 text-right text-xs font-mono font-bold bg-white border-gray-200 focus:border-eden-500 px-1"
                                            value={b.quantity}
                                            onChange={(e) => onStoreQtyChange(item.product_id, b.store_name, e.target.value)}
                                        />
                                        <span className="text-[10px] text-gray-400 font-medium w-6">{t(item.unit)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inputs Section: Unit Price & Total Price */}
            <AnimatePresence>
                {item.status !== 'bought' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-2 gap-3 pt-1"
                    >
                        <div className="relative">
                            <label className="absolute left-3 top-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{ui('unitPrice')}</label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="h-12 pt-4 text-right font-mono font-bold text-base bg-gray-50 border-transparent focus:bg-white focus:border-eden-500 transition-all rounded-xl shadow-sm"
                                value={unitPriceInputValue}
                                onChange={(e) => onUnitPriceChange(item.product_id, e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <label className="absolute left-3 top-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{ui('totalCost')}</label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="h-12 pt-4 text-right font-mono font-bold text-base bg-gray-50 border-transparent focus:bg-white focus:border-eden-500 transition-all rounded-xl shadow-sm"
                                value={priceInputValue}
                                onChange={(e) => onTotalPriceChange(item.product_id, e.target.value)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});
