import { Trash2, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { haptic } from '../../lib/telegram';
import { formatCurrency } from '../../lib/utils';

interface CartSheetProps {
    cartItems: Array<{ product: Product | undefined; qty: number }>;
    estimatedTotal: number;
    submitting: boolean;
    onSubmit: () => void;
    onUpdateQty: (productId: string, qty: number) => void;
    isCartOpen: boolean;
}

export const CartSheet = ({
    cartItems,
    estimatedTotal,
    submitting,
    onSubmit,
    onUpdateQty,
}: CartSheetProps) => {
    const { t, ui } = useLanguage();

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">{ui('cartEmpty')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto divide-y divide-border">
                {cartItems.map(({ product, qty }) => {
                    if (!product) return null;
                    return (
                        <div key={product.id} className="flex items-center py-3 gap-3 px-1">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{t(product.name_i18n)}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {qty} × {product.price_reference?.toLocaleString() || '−'} {t(product.unit_i18n)}
                                </p>
                            </div>
                            <span className="text-xs font-mono text-foreground shrink-0">
                                {product.price_reference ? formatCurrency(product.price_reference * qty) : '−'}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    haptic.impact('light');
                                    onUpdateQty(product.id, 0);
                                }}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="pt-3 pb-safe border-t border-border mt-auto space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{ui('estimatedTotal')}</span>
                    <span className="font-bold text-foreground">{formatCurrency(estimatedTotal)}</span>
                </div>
                <Button
                    className="w-full h-12 font-bold text-sm"
                    onClick={onSubmit}
                    disabled={submitting}
                >
                    {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    {ui('confirmSubmit')}
                </Button>
            </div>
        </div>
    );
};
