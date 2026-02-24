import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { SPRING } from '../../lib/design';

interface BottomDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    badge?: string | number;
    children: ReactNode;
    footer?: ReactNode;
}

/**
 * Reusable bottom sheet drawer with spring animation,
 * backdrop, title bar, scrollable content, and footer slot.
 */
export const BottomDrawer = ({ open, onClose, title, badge, children, footer }: BottomDrawerProps) => (
    <AnimatePresence>
        {open && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black z-drawer"
                />

                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={SPRING.snappy}
                    className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl z-drawer max-h-[85vh] flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-4 border-b flex justify-between items-center shrink-0">
                        <h2 className="text-xl font-bold">
                            {title}
                            {badge !== undefined && (
                                <span className="ml-1 text-muted-foreground font-normal">({badge})</span>
                            )}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X size={24} />
                        </Button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="p-4 border-t border-border bg-muted/50 shrink-0 pb-tma-safe">
                            {footer}
                        </div>
                    )}
                </motion.div>
            </>
        )}
    </AnimatePresence>
);
