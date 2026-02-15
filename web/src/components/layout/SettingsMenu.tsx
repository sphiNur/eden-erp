import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Check, Bug, Shield, User as UserIcon, ShoppingCart, Briefcase, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { UserRole } from '../../types';

export const SettingsMenu = () => {
    const { language, setLanguage } = useLanguage();
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showDevTools, setShowDevTools] = useState(false);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    // DevTools Logic
    const isDev = import.meta.env.DEV;
    const canShowDevTools = isDev || (user?.role === 'admin');
    const isMocking = !!localStorage.getItem('dev_mock_user');

    const handleSetRole = (role: UserRole) => {
        const mockUser = {
            id: '00000000-0000-4000-a000-000000000001',
            telegram_id: 123456789,
            username: `mock_${role}`,
            role: role
        };
        localStorage.setItem('dev_mock_user', JSON.stringify(mockUser));
        window.location.reload();
    };

    const handleClearMock = () => {
        localStorage.removeItem('dev_mock_user');
        window.location.reload();
    };

    return (
        <div className="relative" ref={containerRef}>
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-gray-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Settings className="h-5 w-5 text-gray-600" />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className="absolute right-0 top-11 bg-white border border-gray-200 shadow-xl rounded-xl p-3 w-64 z-[1000] flex flex-col gap-3"
                    >
                        {/* ─── Language Section ─── */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
                                <Globe size={12} />
                                <span>Language</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all
                                            ${language === lang.code
                                                ? 'bg-eden-50 border-eden-200 text-eden-600 shadow-sm'
                                                : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-xl mb-0.5">{lang.flag}</span>
                                        <span className="text-[10px] font-medium">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ─── DevTools Toggle (Only if allowed) ─── */}
                        {(canShowDevTools || isMocking) && (
                            <>
                                <div className="h-px bg-gray-100" />
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setShowDevTools(!showDevTools)}
                                        className="flex items-center justify-between w-full px-1 py-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                            <Bug size={12} />
                                            <span>Developer Tools</span>
                                        </div>
                                        {showDevTools ? (
                                            <Check size={14} className="text-eden-500" />
                                        ) : (
                                            <span className="text-[10px] text-gray-400">Expand</span>
                                        )}
                                    </button>

                                    {showDevTools && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="space-y-1 pt-1"
                                        >
                                            <div className="text-[10px] text-center bg-yellow-50 text-yellow-700 py-1 rounded">
                                                Role Switcher (Mock Mode)
                                            </div>
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => handleSetRole('admin')}>
                                                <Shield className="mr-2 h-3 w-3 text-purple-500" /> Admin
                                            </Button>
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => handleSetRole('store_manager')}>
                                                <UserIcon className="mr-2 h-3 w-3 text-blue-500" /> Manager
                                            </Button>
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => handleSetRole('global_purchaser')}>
                                                <ShoppingCart className="mr-2 h-3 w-3 text-green-500" /> Purchaser
                                            </Button>
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => handleSetRole('finance')}>
                                                <Briefcase className="mr-2 h-3 w-3 text-amber-500" /> Finance
                                            </Button>

                                            {isMocking && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="w-full mt-2 h-7 text-xs"
                                                    onClick={handleClearMock}
                                                >
                                                    Reset to Real User
                                                </Button>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
