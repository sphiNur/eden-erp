import { memo } from 'react';
import { Product } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocale } from '../../lib/locale';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface ProductListItemProps {
    product: Product;
    quantity: number;
    onChange: (val: number) => void;
}

export const ProductListItem = memo(({ product, quantity, onChange }: ProductListItemProps) => {
    const { t, language } = useLanguage();
    const locale = getLocale(language);

    return (
        <div
            className={cn(
                "px-3 py-2 flex items-center justify-between transition-colors",
                quantity > 0 ? "bg-accent/50" : "hover:bg-accent/30"
            )}
        >
            <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5 overflow-hidden">
                <div className="font-semibold text-foreground text-[13px] truncate">
                    {t(product.name_i18n)}
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">
                    {formatCurrency(product.price_reference || 0, 'UZS', locale)} / {t(product.unit_i18n)}
                </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-none border-border"
                    onClick={() => onChange(Math.max(0, quantity - 1))}
                    disabled={quantity <= 0}
                >
                    <Minus size={16} />
                </Button>
                <div className="w-8 text-center font-bold text-sm tabular-nums">
                    {quantity}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => onChange(quantity + 1)}
                >
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparison for performance optimization
    return (
        prev.quantity === next.quantity &&
        prev.product.id === next.product.id &&
        // We assume product details rarely change during a session
        true
    );
});
