import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { SPRING } from '../../lib/design';

interface SuccessOverlayProps {
    show: boolean;
    message: string;
}

/**
 * Full-screen success animation overlay with green checkmark.
 */
export const SuccessOverlay = ({ show, message }: SuccessOverlayProps) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 z-alert flex items-center justify-center bg-black/80"
            >
                <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl border border-border">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ ...SPRING.bouncy, delay: 0.1 }}
                        className="w-16 h-16 bg-success rounded-full flex items-center justify-center text-primary-foreground"
                    >
                        <Check size={32} className="text-primary-foreground" />
                    </motion.div>
                    <p className="text-lg font-bold text-foreground">{message}</p>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);
