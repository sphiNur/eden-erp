import { Loader2 } from 'lucide-react';

import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../lib/utils';
import { getLocale } from '../../lib/locale';
import { Product } from '../../types';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface CartItem {
    product: Product | undefined;
    qty: number;
}

interface CartSheetProps {
    cartItems: CartItem[];
    estimatedTotal: number;
    submitting: boolean;
    onSubmit: () => void;
    onUpdateQty: (productId: string, val: number) => void;
}

export const CartSheet = ({
    cartItems,
    estimatedTotal,
    submitting,
    onSubmit,
    onUpdateQty
}: CartSheetProps) => {
    const { t, ui, language } = useLanguage();
    const locale = getLocale(language);

    return (
        <>
            <div className="space-y-1 divide-y divide-border mb-4">
                {cartItems.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">{ui('cartEmpty')}</div>
                ) : (
                    cartItems.map(({ product, qty }) => (
                        <div key={product?.id} className="flex justify-between items-center py-2 px-1">
                            <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5 overflow-hidden">
                                <div className="font-semibold text-foreground text-[13px] truncate">
                                    {product ? t(product.name_i18n) : 'Unknown'}
                                </div>
                                <div className="text-[10px] text-muted-foreground shrink-0">
                                    {product ? t(product.unit_i18n) : ''}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-full shadow-none"
                                    onClick={() => product && onUpdateQty(product.id, Math.max(0, qty - 1))}
                                >
                                    <Minus size={12} />
                                </Button>
                                <div className="w-6 text-center font-bold text-xs tabular-nums">
                                    {qty}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                    onClick={() => product && onUpdateQty(product.id, qty + 1)}
                                >
                                    <Plus size={12} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="space-y-2 mt-auto">
                {estimatedTotal > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground px-1">
                        <span>{ui('estimatedTotal')}</span>
                        <span className="font-mono font-bold text-foreground">
                            ~{formatCurrency(estimatedTotal, 'UZS', locale)}
                        </span>
                    </div>
                )}

                <Button
                    onClick={onSubmit}
                    disabled={submitting || cartItems.length === 0}
                    size="lg"
                    className="w-full text-lg font-bold h-12 disabled:opacity-50"
                >
                    {submitting && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                    {ui('confirmSubmit')}
                </Button>
            </div>
        </>
    );
};
