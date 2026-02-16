import { memo } from 'react';
import { Product } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { QuantityControl } from '../shared/QuantityControl';
import { getLocale } from '../../lib/locale';

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
                quantity > 0 ? "bg-eden-50" : "hover:bg-gray-50"
            )}
        >
            <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5 overflow-hidden">
                <div className="font-semibold text-gray-900 text-[13px] truncate">
                    {t(product.name_i18n)}
                </div>
                <div className="text-[10px] text-gray-400 shrink-0">
                    {formatCurrency(product.price_reference || 0, 'UZS', locale)} / {t(product.unit_i18n)}
                </div>
            </div>

            <QuantityControl
                value={quantity}
                onChange={onChange}
            />
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
