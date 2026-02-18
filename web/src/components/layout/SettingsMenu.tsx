import { useState } from 'react';
import { Settings, Bug, Globe, Power, User, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/sheet';
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
    };

    return (
        <Sheet open={open} onOpenChange={(val) => {
            if (val) WebApp.HapticFeedback.impactOccurred('light');
            setOpen(val);
        }}>
            {/* Standard Sheet Trigger */}
            <SheetTrigger asChild>
                {children ? (
                    children
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </SheetTrigger>

            <SheetContent
                side="top"
                overlayClassName="top-[var(--header-h)] z-50 bg-black/20 backdrop-blur-[1px]"
                className={cn(
                    "rounded-b-2xl border-b-0 shadow-xl bg-white/95 backdrop-blur-xl [&>button]:hidden z-50",
                    "p-0 gap-0 w-full max-h-[80vh] overflow-hidden flex flex-col"
                )}
                style={{
                    top: 'var(--header-h)',
                    marginTop: 0
                }}
            >
                {/* Header Section */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100/50">
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                {user.photo_url ? (
                                    <img src={user.photo_url} alt="Profile" className="h-10 w-10 rounded-full border border-gray-200" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-eden-50 flex items-center justify-center text-eden-600 border border-eden-100">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-base font-bold text-gray-900 leading-none">
                                        {user.first_name} {user.last_name}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">@{user.username || 'user'}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">{user.role.replace('_', ' ')}</span>
                                </div>
                            </div>
                        ) : (
                            <SheetTitle className="text-base font-bold text-gray-900">Settings</SheetTitle>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-gray-100/50 text-gray-400 hover:text-gray-600"
                        onClick={() => setOpen(false)}
                    >
                        <X size={14} />
                    </Button>
                </div>

                <div className="p-4 space-y-5 overflow-y-auto">
                    {/* ─── Compact Language Section ─── */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                            <Globe size={11} />
                            <span>Language</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-2 rounded-lg border transition-all duration-200",
                                        language === lang.code
                                            ? "bg-eden-50 border-eden-200 text-eden-700 shadow-sm"
                                            : "bg-white border-transparent text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    <span className="text-xs font-bold">{lang.code.toUpperCase()}</span>
                                    {language === lang.code && (
                                        <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-eden-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── DevTools Section ─── */}
                    {(canShowDevTools || isMocking) && (
                        <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Bug size={11} />
                                    <span>Dev</span>
                                </div>
                                {isMocking && (
                                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-px rounded-full font-bold">
                                        MOCK
                                    </span>
                                )}
                            </div>

                            <div className="bg-gray-50/50 rounded-xl p-1 border border-gray-100">
                                <div className="grid grid-cols-3 gap-1">
                                    {Object.values(USER_ROLES).filter(r => r !== 'finance').map((role) => {
                                        const meta = getRoleMetadata(role);
                                        const Icon = meta.icon;
                                        const isActive = user?.role === role;
                                        return (
                                            <button
                                                key={role}
                                                onClick={() => handleSetRole(role as UserRole)}
                                                className={cn(
                                                    "flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg transition-all duration-200",
                                                    isActive
                                                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                                                        : "text-gray-400 hover:text-gray-600"
                                                )}
                                                title={meta.label}
                                            >
                                                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-eden-600" : "opacity-50")} />
                                                <span className="text-[10px] font-medium truncate max-w-[50px]">{meta.label.split(' ')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {isMocking && (
                                    <div className="p-1 mt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-[10px] h-7 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 bg-white"
                                            onClick={handleClearMock}
                                        >
                                            <Power size={10} className="mr-1.5" />
                                            Reset
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
