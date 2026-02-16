import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import WebApp from '@twa-dev/sdk';

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
        if (type === 'success') WebApp.HapticFeedback.notificationOccurred('success');
        if (type === 'error') WebApp.HapticFeedback.notificationOccurred('error');
        if (type === 'info') WebApp.HapticFeedback.impactOccurred('light');

        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    const success = (msg: string) => showToast(msg, 'success');
    const error = (msg: string) => showToast(msg, 'error');
    const info = (msg: string) => showToast(msg, 'info');

    return (
        <ToastContext.Provider value={{ showToast, success, error, info }}>
            {children}
            <div className="fixed top-4 left-0 right-0 z-[100] grid place-items-center pointer-events-none px-4 gap-2">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[280px] max-w-[90vw]",
                                toast.type === 'success' && "bg-white/95 border-emerald-100 text-emerald-800",
                                toast.type === 'error' && "bg-white/95 border-red-100 text-red-800",
                                toast.type === 'info' && "bg-white/95 border-blue-100 text-blue-800"
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-full shrink-0",
                                toast.type === 'success' && "bg-emerald-100 text-emerald-600",
                                toast.type === 'error' && "bg-red-100 text-red-600",
                                toast.type === 'info' && "bg-blue-100 text-blue-600"
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
