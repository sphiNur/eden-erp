/**
 * Toast Context — thin wrapper around Sonner.
 * Provides haptic feedback on toast events and exposes a consistent API.
 */
import { ReactNode, createContext, useContext, useCallback } from 'react';
import { toast } from 'sonner';
import { haptic } from '../lib/telegram';

export type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        if (type === 'success') {
            haptic.notification('success');
            toast.success(message);
        } else if (type === 'error') {
            haptic.notification('error');
            toast.error(message);
        } else {
            haptic.impact('light');
            toast.info(message);
        }
    }, []);

    const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
    const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
    const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info }}>
            {children}
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
