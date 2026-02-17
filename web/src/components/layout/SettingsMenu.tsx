import { useState } from 'react';
import { Settings, Check, Bug, Globe, Power, User, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from '../ui/sheet';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { UserRole } from '../../types';
import { USER_ROLES, getRoleMetadata } from '../../constants/roles';
import WebApp from '@twa-dev/sdk';
import { cn } from '../../lib/utils';

interface SettingsMenuProps {
    children?: React.ReactNode;
}

export const SettingsMenu = ({ children }: SettingsMenuProps) => {
    const { language, setLanguage } = useLanguage();
    const { user } = useUser();
    const [open, setOpen] = useState(false);

    // DevTools Logic
    const isDev = import.meta.env.DEV;
    const canShowDevTools = isDev || (user?.role === 'admin');
    const isMocking = !!localStorage.getItem('dev_mock_user');

    const handleSetRole = (role: UserRole) => {
        WebApp.HapticFeedback.impactOccurred('medium');
        const mockUser = {
            id: '00000000-0000-4000-a000-000000000001',
            telegram_id: 123456789,
            username: `mock_${role}`,
            role: role
        };
        localStorage.setItem('dev_mock_user', JSON.stringify(mockUser));
        window.location.href = '/';
    };

    const handleClearMock = () => {
        WebApp.HapticFeedback.impactOccurred('heavy');
        localStorage.removeItem('dev_mock_user');
        window.location.href = '/';
    };

    const handleLanguageChange = (code: typeof language) => {
        WebApp.HapticFeedback.selectionChanged();
        setLanguage(code);
        // Optional: close after selection or keep open? keeping open for now.
    };

    return (
        <Sheet open={open} onOpenChange={(val) => {
            if (val) WebApp.HapticFeedback.impactOccurred('light');
            setOpen(val);
        }}>
            <SheetTrigger asChild>
                {children ? (
                    children
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-gray-500 hover:text-gray-900"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                )}
            </SheetTrigger>

            <SheetContent
                side="top"
                className="rounded-b-3xl border-b-0 shadow-2xl pt-safe bg-white/95 backdrop-blur-xl [&>button]:hidden"
            >
                <div className="flex items-center justify-between px-1 pb-4 pt-2">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        Settings
                    </SheetTitle>
                    <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gray-100/50 hover:bg-gray-100">
                            <X className="h-4 w-4 text-gray-500" />
                        </Button>
                    </SheetClose>
                </div>

                <div className="space-y-8 pb-8 overflow-auto max-h-[75vh]">
                    {/* ─── Profile / Info ─── */}
                    {user && (
                        <div className="bg-gray-50/80 rounded-2xl p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-eden-600">
                                <User size={24} />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-base">{user.username || 'User'}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5 opacity-80 uppercase tracking-wider">
                                    {user.role}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Language Section ─── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                            <Globe size={13} strokeWidth={2.5} />
                            <span>Language</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={cn(
                                        "relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left group overflow-hidden",
                                        language === lang.code
                                            ? "bg-eden-50 border-eden-200 shadow-sm"
                                            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-100"
                                    )}
                                >
                                    <span className="text-2xl z-10">{lang.flag}</span>
                                    <div className="flex-1 z-10">
                                        <div className={cn(
                                            "text-[13px] font-semibold leading-none mb-1",
                                            language === lang.code ? 'text-eden-900' : 'text-gray-900'
                                        )}>
                                            {lang.label}
                                        </div>
                                    </div>
                                    {language === lang.code && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-eden-600">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── DevTools Section ─── */}
                    {(canShowDevTools || isMocking) && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <Bug size={13} strokeWidth={2.5} />
                                    <span>Dev Tools</span>
                                </div>
                                {isMocking && (
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold shadow-sm">
                                        MOCKING ACTIVE
                                    </span>
                                )}
                            </div>

                            <div className="bg-gray-50/50 rounded-2xl p-1 border border-gray-100">
                                <div className="grid grid-cols-2 gap-1">
                                    {Object.values(USER_ROLES).map((role) => {
                                        const meta = getRoleMetadata(role);
                                        const Icon = meta.icon;
                                        const isActive = user?.role === role;
                                        return (
                                            <button
                                                key={role}
                                                onClick={() => handleSetRole(role as UserRole)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                                                        : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
                                                )}
                                            >
                                                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-eden-600" : "opacity-50")} />
                                                <span>{meta.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {isMocking && (
                                    <div className="p-1 mt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs h-8 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 bg-white"
                                            onClick={handleClearMock}
                                        >
                                            <Power size={12} className="mr-2" />
                                            Reset Identity
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
