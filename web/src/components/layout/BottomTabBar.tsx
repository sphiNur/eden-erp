import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Package, Store, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import WebApp from '@twa-dev/sdk';

const ADMIN_TABS = [
    { key: 'inventory', icon: Package, path: '/admin/products' },
    { key: 'teamManagement', icon: Users, path: '/admin/users' },
    { key: 'stores', icon: Store, path: '/admin/stores' },
    { key: 'analytics', icon: BarChart3, path: '/admin/analytics' },
] as const;

export const BottomTabBar = () => {
    const { user } = useUser();
    const { ui } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    // Only show for admin and finance roles
    if (!user || !['admin', 'finance'].includes(user.role)) return null;

    const handleNav = (path: string) => {
        if (location.pathname !== path) {
            WebApp.HapticFeedback.selectionChanged();
            navigate(path);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-nav shadow-[0_-1px_3px_rgba(0,0,0,0.05)] h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
            {ADMIN_TABS.map((tab) => {
                const isActive = location.pathname === tab.path ||
                    location.pathname.startsWith(tab.path);

                return (
                    <button
                        key={tab.path}
                        onClick={() => handleNav(tab.path)}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                            isActive
                                ? "text-eden-500"
                                : "text-gray-400 hover:text-gray-600 active:text-gray-500"
                        )}
                    >
                        <tab.icon
                            size={isActive ? 24 : 22}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={cn("transition-all", isActive && "scale-110")}
                        />
                        <span className="text-[10px] font-medium leading-tight text-center max-w-[60px] truncate">
                            {ui(tab.key as Parameters<typeof ui>[0])}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
