import React, { useState } from 'react';
import { Globe, Bug, Power, User, X, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { UserRole } from '../../types';
import { USER_ROLES, getRoleMetadata } from '../../constants/roles';
import { haptic, isFullscreenSupported, requestFullscreen, exitFullscreen } from '../../lib/telegram';
import { cn } from '../../lib/utils';

interface SettingsMenuProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const SettingsMenu = ({ children, open: controlledOpen, onOpenChange }: SettingsMenuProps) => {
    const { language, setLanguage } = useLanguage();
    const { user } = useUser();
    const [internalOpen, setInternalOpen] = useState(false);

    // Support both controlled (from BottomTabBar) and uncontrolled
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        if (isControlled) {
            onOpenChange?.(val);
        } else {
            setInternalOpen(val);
        }
    };

    // DevTools Logic
    const isDev = import.meta.env.DEV;
    const canShowDevTools = isDev || (user?.role === 'admin');
    const isMocking = !!localStorage.getItem('dev_mock_user');

    const handleSetRole = (role: UserRole) => {
        haptic.impact('medium');
        const mockUser = {
            id: '00000000-0000-4000-a000-000000000001',
            telegram_id: 123456789,
            username: `mock_${role}`,
            role: role
        };
        localStorage.setItem('dev_mock_user', JSON.stringify(mockUser));
        window.location.assign('/');
    };

    const handleClearMock = () => {
        haptic.impact('heavy');
        localStorage.removeItem('dev_mock_user');
        window.location.assign('/');
    };

    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleFullscreenToggle = () => {
        haptic.impact('light');
        if (isFullscreen) {
            exitFullscreen();
        } else {
            requestFullscreen();
        }
        setIsFullscreen(!isFullscreen);
    };

    const handleLanguageChange = (code: typeof language) => {
        haptic.selection();
        setLanguage(code);
    };

    return (
        <Sheet open={open} onOpenChange={(val) => {
            if (val) haptic.impact('light');
            setOpen(val);
        }}>
            {/* Trigger: provided by parent (BottomTabBar button) */}
            {children && (
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
            )}

            <SheetContent
                side="bottom"
                className={cn(
                    "rounded-t-2xl border-t-0 border-border shadow-xl bg-card/95 backdrop-blur-xl [&>button]:hidden",
                    "p-0 gap-0 w-full max-h-[75vh] overflow-hidden flex flex-col"
                )}
            >
                {/* Header Section */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                {user.photo_url ? (
                                    <img src={user.photo_url} alt="" className="h-10 w-10 rounded-full border border-border" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-base font-bold text-foreground leading-none">
                                        {user.first_name} {user.last_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">@{user.username || 'user'}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">{user.role.replace('_', ' ')}</span>
                                </div>
                            </div>
                        ) : (
                            <SheetTitle className="text-base font-bold text-foreground">Settings</SheetTitle>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => setOpen(false)}
                        aria-label="Close Settings"
                    >
                        <X size={18} />
                    </Button>
                </div>

                <div className="p-4 space-y-5 overflow-y-auto pb-safe">
                    {/* ─── Compact Language Section ─── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Globe size={11} />
                                <span>Language</span>
                            </div>

                            {isFullscreenSupported() && (
                                <button
                                    type="button"
                                    onClick={handleFullscreenToggle}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                >
                                    {isFullscreen ? <Minimize size={11} /> : <Maximize size={11} />}
                                    <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-2 rounded-lg border border-border transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        language === lang.code
                                            ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                                            : "bg-transparent text-foreground hover:bg-muted"
                                    )}
                                >
                                    <span className="text-xs font-bold">{lang.code.toUpperCase()}</span>
                                    {language === lang.code && (
                                        <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── DevTools Section ─── */}
                    {(canShowDevTools || isMocking) && (
                        <div className="space-y-2 pt-2 border-t border-dashed border-border">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <Bug size={11} />
                                    <span>Dev</span>
                                </div>
                                {isMocking && (
                                    <span className="text-[9px] bg-warning/20 text-warning px-1.5 py-px rounded-full font-bold">
                                        MOCK
                                    </span>
                                )}
                            </div>

                            <div className="bg-muted/50 rounded-xl p-1 border border-border">
                                <div className="grid grid-cols-3 gap-1">
                                    {Object.values(USER_ROLES).filter(r => r !== 'finance').map((role) => {
                                        const meta = getRoleMetadata(role);
                                        const Icon = meta.icon;
                                        const isActive = user?.role === role;
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => handleSetRole(role as UserRole)}
                                                className={cn(
                                                    "flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    isActive
                                                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                                title={meta.label}
                                            >
                                                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "opacity-50")} />
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
                                            className="w-full text-[10px] h-7 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive bg-card"
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
