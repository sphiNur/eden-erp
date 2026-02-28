import { Minus, Plus } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { haptic } from '../../lib/telegram';
import { cn } from '../../lib/utils';

interface ProductListItemProps {
    product: Product;
    quantity: number;
    onChange: (val: number) => void;
}

export const ProductListItem = ({ product, quantity, onChange }: ProductListItemProps) => {
    const { t } = useLanguage();
    const name = t(product.name_i18n);
    const unit = t(product.unit_i18n);
    const hasQty = quantity > 0;

    return (
        <div className={cn(
            "flex items-center px-3 py-2.5 gap-3 transition-colors",
            hasQty ? "bg-primary/[0.03]" : "bg-card"
        )}>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{name}</div>
                <div className="text-[11px] text-muted-foreground">
                    {unit}
                    {product.price_reference ? ` · ${product.price_reference.toLocaleString()} UZS` : ''}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {hasQty && (
                    <button
                        type="button"
                        onClick={() => {
                            haptic.impact('light');
                            onChange(Math.max(0, quantity - 1));
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors active:scale-90"
                    >
                        <Minus size={14} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => {
                        haptic.impact('light');
                        if (!hasQty) onChange(1);
                    }}
                    className={cn(
                        "h-7 min-w-[28px] flex items-center justify-center rounded-full transition-all active:scale-90",
                        hasQty
                            ? "bg-primary/10 text-primary font-bold text-sm px-2"
                            : "bg-accent text-foreground hover:bg-muted"
                    )}
                >
                    {hasQty ? (
                        <span>{quantity}</span>
                    ) : (
                        <Plus size={14} />
                    )}
                </button>
                {hasQty && (
                    <button
                        type="button"
                        onClick={() => {
                            haptic.impact('light');
                            onChange(quantity + 1);
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors active:scale-90"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};
