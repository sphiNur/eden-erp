import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { haptic } from '../lib/telegram';
import { setApiToast } from '../api/client';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        // Haptic feedback based on type
        if (type === 'success') haptic.notification('success');
        if (type === 'error') haptic.notification('error');
        if (type === 'info') haptic.impact('light');

        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    const success = (msg: string) => showToast(msg, 'success');
    const error = (msg: string) => showToast(msg, 'error');
    const info = (msg: string) => showToast(msg, 'info');

    // Make the toast dispatcher available globally to api client
    useEffect(() => {
        setApiToast(showToast);
        return () => setApiToast(null);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info }}>
            {children}
            <div className="fixed bottom-24 left-0 right-0 z-[100] grid place-items-center pointer-events-none px-4 gap-2">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-border backdrop-blur-md min-w-[280px] max-w-[90vw] bg-card/95 text-card-foreground",
                                toast.type === 'success' && "border-success/30 text-foreground",
                                toast.type === 'error' && "border-destructive/30 text-foreground",
                                toast.type === 'info' && "border-primary/30 text-foreground"
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-full shrink-0",
                                toast.type === 'success' && "bg-success/20 text-success",
                                toast.type === 'error' && "bg-destructive/20 text-destructive",
                                toast.type === 'info' && "bg-primary/20 text-primary"
                            )}>
                                {toast.type === 'success' && <CheckCircle2 size={16} />}
                                {toast.type === 'error' && <AlertCircle size={16} />}
                                {toast.type === 'info' && <Info size={16} />}
                            </div>
                            <span className="text-sm font-medium flex-1">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="opacity-50 hover:opacity-100 p-0.5"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
