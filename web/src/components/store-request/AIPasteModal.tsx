import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useStoreRequestContext } from '../../contexts/StoreRequestContext';
import { aiApi } from '../../api/client';
import { tgAlert, tgMainButton } from '../../lib/telegram';

interface AIPasteModalProps {
    open: boolean;
    onClose: () => void;
}

export const AIPasteModal = ({ open, onClose }: AIPasteModalProps) => {
    const { products, setQty } = useStoreRequestContext();
    const [rawText, setRawText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const handleParse = async () => {
        if (!rawText.trim()) return;

        setIsParsing(true);
        tgMainButton.showProgress(true);

        try {
            const response = await aiApi.parseOrder(rawText);

            let matchCount = 0;
            const unknownItems: string[] = [];

            response.items.forEach(item => {
                if (item.product_id) {
                    // Find product to ensure it exists
                    const product = products.find(p => p.id === item.product_id);
                    if (product) {
                        setQty(product.id, item.quantity);
                        matchCount++;
                    } else {
                        unknownItems.push(item.predicted_item_name);
                    }
                } else {
                    unknownItems.push(item.predicted_item_name);
                }
            });

            if (unknownItems.length > 0) {
                tgAlert(`Matched ${matchCount} items. Could not find: ${unknownItems.join(', ')}`);
            } else {
                tgAlert(`Successfully mapped ${matchCount} items!`);
            }

            setRawText('');
            onClose();

        } catch (error: any) {
            console.error('AI Parse Error:', error);
            tgAlert('Failed to parse order with AI. Please check format or try again later.');
        } finally {
            setIsParsing(false);
            tgMainButton.hideProgress();
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-overlay"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-alert bg-card rounded-t-2xl shadow-xl flex flex-col max-h-[90dvh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="text-primary w-5 h-5" />
                                <h2 className="font-bold text-lg text-foreground">AI Smart Paste</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 flex-1 overflow-y-auto">
                            <p className="text-sm text-muted-foreground mb-3">
                                Paste the raw order list from Telegram messages regardless of language, spelling, or format. Genesis AI will automatically map them to catalog items.
                            </p>
                            <textarea
                                className="w-full h-48 bg-accent/50 border border-border rounded-xl p-3 text-[13px] text-foreground focus:ring-2 focus:ring-primary outline-none resize-none transition-shadow"
                                placeholder={`e.g. 
Boʻyin goʻsht 3 kilo
Toʻgʻralgan sariq sabzi 2 kilo
Kartoshka 2 kilo...`}
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-card shrink-0">
                            <button
                                onClick={handleParse}
                                disabled={!rawText.trim() || isParsing}
                                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {isParsing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing context...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Map & Add to Cart
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
