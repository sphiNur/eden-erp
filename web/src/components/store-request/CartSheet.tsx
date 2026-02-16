import { Loader2, Save } from 'lucide-react';

import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../lib/utils';
import { getLocale } from '../../lib/locale';
import { Product } from '../../types';
import { QuantityControl } from '../shared/QuantityControl';

interface CartItem {
    product: Product | undefined;
    qty: number;
}

interface CartSheetProps {
    cartItems: CartItem[];
    estimatedTotal: number;
    submitting: boolean;
    onSubmit: () => void;
    onSaveTemplate: () => void;
    onUpdateQty: (productId: string, val: number) => void;
}

export const CartSheet = ({
    cartItems,
    estimatedTotal,
    submitting,
    onSubmit,
    onSaveTemplate,
    onUpdateQty
}: CartSheetProps) => {
    const { t, ui, language } = useLanguage();
    const locale = getLocale(language);

    return (
        <>
            <div className="space-y-1 divide-y divide-gray-100 mb-4">
                {cartItems.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">{ui('cartEmpty')}</div>
                ) : (
                    cartItems.map(({ product, qty }) => (
                        <div key={product?.id} className="flex justify-between items-center py-2 px-1">
                            <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5 overflow-hidden">
                                <div className="font-semibold text-gray-900 text-[13px] truncate">
                                    {product ? t(product.name_i18n) : 'Unknown'}
                                </div>
                                <div className="text-[10px] text-gray-400 shrink-0">
                                    {product ? t(product.unit_i18n) : ''}
                                </div>
                            </div>

                            <QuantityControl
                                value={qty}
                                onChange={(val) => product && onUpdateQty(product.id, val)}
                            />
                        </div>
                    ))
                )}
            </div>

            <div className="space-y-2 mt-auto">
                {estimatedTotal > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 px-1">
                        <span>{ui('estimatedTotal')}</span>
                        <span className="font-mono font-bold text-gray-700">
                            ~{formatCurrency(estimatedTotal, 'UZS', locale)}
                        </span>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onSaveTemplate}
                        className="flex-1 border-dashed border-gray-300 text-gray-500 hover:text-eden-600 hover:border-eden-300"
                    >
                        <Save size={16} className="mr-2" />
                        Save Template
                    </Button>
                </div>

                <Button
                    onClick={onSubmit}
                    disabled={submitting || cartItems.length === 0}
                    size="lg"
                    className="w-full text-lg font-bold bg-eden-500 hover:bg-eden-600 h-12 disabled:opacity-50"
                >
                    {submitting && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                    {ui('confirmSubmit')}
                </Button>
            </div>
        </>
    );
};
