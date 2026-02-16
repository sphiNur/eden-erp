import { useState } from 'react';

import { Settings, Check, Bug, Shield, User as UserIcon, ShoppingCart, Briefcase, Globe, Power } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { UserRole } from '../../types';

export const SettingsMenu = () => {
    const { language, setLanguage } = useLanguage();
    const { user } = useUser();
    const [open, setOpen] = useState(false);

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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-gray-100"
                >
                    <Settings className="h-5 w-5 text-gray-600" />
                </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Settings
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-6 pb-8">
                    {/* ─── Language Section ─── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
                            <Globe size={14} />
                            <span>Language</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group
                                        ${language === lang.code
                                            ? 'bg-eden-50 border-eden-200 shadow-sm ring-1 ring-eden-100'
                                            : 'bg-white border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-2xl">{lang.flag}</span>
                                    <div className="flex-1">
                                        <div className={`text-sm font-semibold ${language === lang.code ? 'text-eden-900' : 'text-gray-900'}`}>{lang.label}</div>
                                        <div className="text-[10px] text-gray-400 font-medium uppercase">{lang.code}</div>
                                    </div>
                                    {language === lang.code && (
                                        <div className="w-5 h-5 rounded-full bg-eden-100 flex items-center justify-center">
                                            <Check size={12} className="text-eden-600" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── DevTools Section (Always visible if allowed) ─── */}
                    {(canShowDevTools || isMocking) && (
                        <div className="space-y-3 pt-2 border-t border-dashed border-gray-200">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <Bug size={14} />
                                    <span>Developer Tools</span>
                                </div>
                                {isMocking && (
                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                                        MOCK ACTIVE
                                    </span>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-3">
                                <div className="text-[11px] font-medium text-gray-500 px-1">
                                    Simulate User Role:
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { role: 'admin', icon: Shield, label: 'Admin', color: 'text-purple-600', bg: 'bg-purple-50' },
                                        { role: 'store_manager', icon: UserIcon, label: 'Manager', color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { role: 'global_purchaser', icon: ShoppingCart, label: 'Purchaser', color: 'text-green-600', bg: 'bg-green-50' },
                                        { role: 'finance', icon: Briefcase, label: 'Finance', color: 'text-amber-600', bg: 'bg-amber-50' }
                                    ].map(({ role, icon: Icon, label, color, bg }) => {
                                        const isActive = user?.role === role;
                                        return (
                                            <button
                                                key={role}
                                                onClick={() => handleSetRole(role as UserRole)}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border
                                                    ${isActive
                                                        ? 'bg-white border-eden-200 shadow-sm ring-1 ring-eden-100 text-eden-700 font-semibold'
                                                        : 'bg-white border-transparent text-gray-600 hover:bg-white hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className={`p-1.5 rounded-md ${bg}`}>
                                                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                                                </div>
                                                <span className="flex-1 text-left">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {isMocking && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={handleClearMock}
                                    >
                                        <Power size={14} className="mr-2" />
                                        Reset to Real User
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
