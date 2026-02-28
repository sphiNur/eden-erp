import { useEffect } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';

import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../lib/utils';
import { getLocale } from '../../lib/locale';
import { Product } from '../../types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mainButton, hapticFeedback } from '@telegram-apps/sdk-react';

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
    isCartOpen?: boolean;
}

export const CartSheet = ({
    cartItems,
    estimatedTotal,
    submitting,
    onSubmit,
    onUpdateQty,
    isCartOpen = true
}: CartSheetProps) => {
    const { t, ui, language } = useLanguage();
    const locale = getLocale(language);

    // Integrate with Telegram MainButton if available
    useEffect(() => {
        if (!isCartOpen) {
            if (mainButton.isMounted() && mainButton.isVisible()) {
                mainButton.setParams({ isVisible: false });
            }
            return;
        }

        if (mainButton.isMounted()) {
            const hasItems = cartItems.length > 0;
            if (hasItems && !submitting) {
                mainButton.setParams({
                    text: `${ui('confirmSubmit')} • ${formatCurrency(estimatedTotal, 'UZS', locale)}`,
                    isVisible: true,
                    isEnabled: true,
                    isLoaderVisible: false,
                });

                const handleClick = () => {
                    onSubmit();
                };

                mainButton.onClick(handleClick);
                return () => {
                    mainButton.offClick(handleClick);
                    // We don't hide it immediately on cleanup incase it's unmounted during submission 
                    // Let the parent manage global mainButton state if needed, or hide if cart closes
                };
            } else if (submitting) {
                mainButton.setParams({
                    text: '...',
                    isEnabled: false,
                    isLoaderVisible: true,
                });
            } else {
                mainButton.setParams({ isVisible: false });
            }
        }
    }, [cartItems.length, estimatedTotal, submitting, onSubmit, isCartOpen, ui, locale]);

    const handleQtyChange = (productId: string, newQty: number) => {
        if (hapticFeedback.isSupported()) {
            hapticFeedback.impactOccurred('light');
        }
        onUpdateQty(productId, newQty);
    };

    const isTgMainButtonAvailable = mainButton.isMounted();

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 pr-3 -mr-3">
                <div className="space-y-1 divide-y divide-border mb-4 pl-1">
                    {cartItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">{ui('cartEmpty')}</div>
                    ) : (
                        cartItems.map(({ product, qty }) => (
                            <div key={product?.id} className="flex justify-between items-center py-3">
                                <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center overflow-hidden">
                                    <div className="font-semibold text-foreground text-sm truncate">
                                        {product ? t(product.name_i18n) : 'Unknown'}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground shrink-0">
                                        {product ? t(product.unit_i18n) : ''}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-full shadow-none border-border"
                                        onClick={() => product && handleQtyChange(product.id, Math.max(0, qty - 1))}
                                    >
                                        <Minus size={16} />
                                    </Button>
                                    <div className="w-6 text-center font-bold text-sm tabular-nums">
                                        {qty}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                        onClick={() => product && handleQtyChange(product.id, qty + 1)}
                                    >
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="space-y-3 pt-4 border-t border-border mt-auto">
                {estimatedTotal > 0 && (
                    <div className="flex justify-between text-base px-1">
                        <span className="text-muted-foreground font-medium">{ui('estimatedTotal')}</span>
                        <span className="font-bold text-foreground">
                            ~{formatCurrency(estimatedTotal, 'UZS', locale)}
                        </span>
                    </div>
                )}

                {/* Only show web button if TG MainButton is not available */}
                {!isTgMainButtonAvailable && (
                    <Button
                        onClick={onSubmit}
                        disabled={submitting || cartItems.length === 0}
                        size="lg"
                        className="w-full text-base font-bold h-12 shadow-md rounded-xl disabled:opacity-50"
                    >
                        {submitting && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                        {ui('confirmSubmit')}
                    </Button>
                )}
            </div>
        </div>
    );
};
